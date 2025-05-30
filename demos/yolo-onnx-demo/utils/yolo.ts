// Heavily derived from YAD2K (https://github.com/ModelDepot/tfjs-yolo-tiny-demo)

import {Tensor} from 'onnxruntime-web';

import classNames from '../data/yolo_classes';

import * as yolo from './utils-yolo/yoloPostprocess';

export const YOLO_ANCHORS = new Tensor(
    'float32', Float32Array.from([
      1.08,
      1.19,
      3.42,
      4.41,
      6.63,
      11.38,
      9.42,
      5.11,
      16.62,
      10.52,
    ]),
    [5, 2]);
const DEFAULT_FILTER_BOXES_THRESHOLD = 0.01;
const DEFAULT_IOU_THRESHOLD = 0.7;
const DEFAULT_CLASS_PROB_THRESHOLD = 0.5;
const INPUT_DIM = 640;

export async function postprocess(outputTensor: Tensor) {
  const [boxXy, boxWh, boxConfidence, boxClassProbs, boxTheta] = yolo_head(outputTensor);
  const allBoxes = yolo_boxes_to_corners(boxXy, boxWh, boxTheta);
  const [outputBoxes, scores, classes] =
      await yolo_filter_boxes(allBoxes, boxConfidence, boxClassProbs, DEFAULT_FILTER_BOXES_THRESHOLD);
  // If all boxes have been filtered out
  if (outputBoxes == null) {
    return [];
  }

  const width = yolo.scalar(1);
  const height = yolo.scalar(1);

  const imageDims = yolo.reshape(yolo.stack([height, width, height, width]), [
    1,
    4,
  ]);

  const boxes: Tensor = yolo.mul(outputBoxes, imageDims);

  const [preKeepBoxesArr, scoresArr] = await Promise.all([
    boxes.data,
    scores.data,
  ]);

  const [keepIndx, boxesArr, keepScores] = non_max_suppression(
      preKeepBoxesArr as Float32Array | Int32Array | Uint8Array, scoresArr as Float32Array | Int32Array | Uint8Array,
      DEFAULT_IOU_THRESHOLD);

  const classesIndxArr = (await yolo.gather(classes, new Tensor('int32', keepIndx)).data) as Float32Array;

  const results: any[] = [];

  classesIndxArr.forEach((classIndx, i) => {
    const classProb = keepScores[i];
    if (classProb < DEFAULT_CLASS_PROB_THRESHOLD) {
      return;
    }

    const className = classNames[classIndx];
    let [top, left, bottom, right] = boxesArr[i];

    top = Math.min(640,Math.max(0, top));
    left = Math.min(640,Math.max(0, left));
    bottom = Math.min(640, Math.max(0, bottom));
    right = Math.min(640, Math.max(0, right));

    const resultObj = {
      className,
      classProb,
      bottom,
      top,
      left,
      right,
    };

    results.push(resultObj);
  });
  return results;
}

export async function yolo_filter_boxes(
    boxes: Tensor, boxConfidence: Tensor, boxClassProbs: Tensor, threshold: number) {
  const boxScores = boxClassProbs; // yolo.mul(boxConfidence, boxClassProbs);
  const boxClasses = yolo.argMax(boxScores, -1);
  const boxClassScores = yolo.max(boxScores, -1);
  // Many thanks to @jacobgil
  // Source: https://github.com/ModelDepot/tfjs-yolo-tiny/issues/6#issuecomment-387614801
  const predictionMask = yolo.as1D(yolo.greaterEqual(boxClassScores, yolo.scalar(threshold)));

  const N = predictionMask.size;
  // linspace start/stop is inclusive.
  const allIndices = yolo.cast(yolo.linspace(0, N - 1, N), 'int32');
  const negIndices = yolo.zeros([N], 'int32');
  const indices = yolo.where(predictionMask, allIndices, negIndices);

  return [
    yolo.gather(yolo.reshape(boxes, [N, 4]), indices),
    yolo.gather(yolo.as1D(boxClassScores), indices),
    yolo.gather(yolo.as1D(boxClasses), indices),
  ];
}

/**
 * Given XY and WH tensor outputs of yolo_head, returns corner coordinates.
 * @param {Tensor} boxXy Oriented bounding box center XY coordinate Tensor
 * @param {Tensor} boxWh Oritented bounding box WH Tensor
 * @param {Tensor} boxTheta Oriented bounding box rotation Tensor in radians from 0 to pi/2
 * @returns {Tensor} Bounding box corner Tensor
 */
export function yolo_boxes_to_corners(boxXy: Tensor, boxWh: Tensor, boxTheta: Tensor) {
  const dim0 = boxWh.dims[0];
  const dim1 = boxWh.dims[1];
  const dim2 = boxWh.dims[2];
  const size = [dim0, dim1, 1];

  const two = new Tensor('float32', [2.0]);
  const negativeTwo = new Tensor('float32', [-2.0]);
  const cosTheta = yolo.cos(boxTheta)
  const sinTheta = yolo.sin(boxTheta)
  const width = yolo.slice(boxWh,[0, 0, 0],size)
  const height = yolo.slice(boxWh,[0, 0, 1],size)

  // rotate half-extents
  const col0 = yolo.concat([yolo.mul(yolo.div(width, two), cosTheta), yolo.mul(yolo.div(width, two), sinTheta)], 2)
  const col1 = yolo.concat([yolo.mul(yolo.div(height, negativeTwo), sinTheta), yolo.mul(yolo.div(height, two),cosTheta)], 2)
  const prime = yolo.add(col0, col1)

  const boxMins = yolo.sub(boxXy, prime);
  const boxMaxes = yolo.add(boxXy, prime);

  return yolo.concat(
      [
        yolo.slice(boxMins, [0, 0, 1], size),
        yolo.slice(boxMins, [0, 0, 0], size),
        yolo.slice(boxMaxes, [0, 0, 1], size),
        yolo.slice(boxMaxes, [0, 0, 0], size),
      ],
      2);
}

/**
 * Filters/deduplicates overlapping boxes predicted by YOLO. These
 * operations are done on CPU as AFAIK, there is no tfjs way to do it
 * on GPU yet.
 * @param {TypedArray} boxes Bounding box corner data buffer from Tensor
 * @param {TypedArray} scores Box scores data buffer from Tensor
 * @param {Number} iouThreshold IoU cutoff to filter overlapping boxes
 */
export function non_max_suppression(
    boxes: Float32Array|Int32Array|Uint8Array, scores: Float32Array|Int32Array|Uint8Array, iouThreshold: number) {
  // Zip together scores, box corners, and index
  const zipped = [];
  for (let i = 0; i < scores.length; i++) {
    zipped.push([
      scores[i],
      [boxes[4 * i], boxes[4 * i + 1], boxes[4 * i + 2], boxes[4 * i + 3]],
      i,
    ]);
  }
  // Sort by descending order of scores (first index of zipped array)
  const sortedBoxes = zipped.sort((a: number[], b: number[]) => b[0] - a[0]);

  const selectedBoxes: any[] = [];

  // hack: left/right swap in yolo_boxes_to_corners
  sortedBoxes.forEach((box: any[]) => {
    const top = Math.min(box[1][0], box[1][2])
    const left = Math.min(box[1][1], box[1][3])
    const bottom = Math.max(box[1][0], box[1][2])
    const right = Math.max(box[1][1], box[1][3])
    box[1][0] = top
    box[1][1] = left
    box[1][2] = bottom
    box[1][3] = right
  })

  // Greedily go through boxes in descending score order and only
  // return boxes that are below the IoU threshold.
  sortedBoxes.forEach((box: any[]) => {
    let add = true;
    for (let i = 0; i < selectedBoxes.length; i++) {
      // Compare IoU of zipped[1], since that is the box coordinates arr
      // TODO: I think there's a bug in this calculation
      const curIou = box_iou(box[1], selectedBoxes[i][1]);
      if (curIou > iouThreshold) {
        add = false;
        break;
      }
    }
    if (add) {
      selectedBoxes.push(box);
    }
  });

  // Return the kept indices and bounding boxes
  return [
    selectedBoxes.map((e) => e[2]),
    selectedBoxes.map((e) => e[1]),
    selectedBoxes.map((e) => e[0]),
  ];
}

// Convert yolo output to bounding box + prob tensors
export function yolo_head(feats: Tensor) {
  const boxXy = (yolo.slice(feats, [0, 0, 0], [1, 8400, 2]));
  const boxWh = (yolo.slice(feats, [0, 0, 2], [1, 8400, 2]));
  const boxClassProbs = (yolo.slice(feats, [0, 0, 4], [1, 8400, 6]));
  const boxConfidence = null; // Note(kbostelmann): Not present.
  const boxTheta = (yolo.slice(feats, [0, 0, 10], [1, 8400, 1])); // i.e. Rotation.

  return [boxXy, boxWh, boxConfidence, boxClassProbs, boxTheta];
}

//yx, yx
// top left, bottom right
// 0   1   , 2      3
export function box_intersection(a: number[], b: number[]) {
  const w = Math.min(a[3], b[3]) - Math.max(a[1], b[1]);
  const h = Math.min(a[2], b[2]) - Math.max(a[0], b[0]);
  if (w < 0 || h < 0) {
    return 0;
  }
  return w * h;
}

export function box_union(a: number[], b: number[]) {
  const i = box_intersection(a, b);
  return (a[3] - a[1]) * (a[2] - a[0]) + (b[3] - b[1]) * (b[2] - b[0]) - i;
}

export function box_iou(a: number[], b: number[]) {
  return box_intersection(a, b) / box_union(a, b);
}
