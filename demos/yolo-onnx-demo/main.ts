import ndarray from "ndarray";
import ops from "ndarray-ops";
import { runModelUtils, yolo, yoloTransforms } from "./utils/index";
import { Tensor, InferenceSession } from "onnxruntime-web";
import * as fs from 'fs';

const imageSize = 640 // 416

function preprocess(image: any): Tensor {
    const { data, width, height } = image;
    // data processing
    // rbga
    // python bgr
    const dataTensor = ndarray(new Float32Array(data), [width, height, 4]);
    const dataProcessedTensor = ndarray(new Float32Array(width * height * 3), [
      1,
      3,
      width,
      height,
    ]);

    ops.assign(
      dataProcessedTensor.pick(0, 0, null, null),
      dataTensor.pick(null, null, 0)
    );
    ops.assign(
      dataProcessedTensor.pick(0, 1, null, null),
      dataTensor.pick(null, null, 1)
    );
    ops.assign(
      dataProcessedTensor.pick(0, 2, null, null),
      dataTensor.pick(null, null, 2)
    );

    ops.mulseq(dataProcessedTensor, 1/255)

    const tensor = new Tensor("float32", new Float32Array(width * height * 3), [
      1,
      3,
      width,
      height,
    ]);
    (tensor.data as Float32Array).set(dataProcessedTensor.data);

    return tensor;
}

async function postprocess(tensor: Tensor, inferenceTime: number) {
  try {
    const originalOutput = new Tensor(
      "float32",
      tensor.data as Float32Array,
      [1, 11, 8400]
    );

    // [1, 11, 8400] to [1, 8400, 11]
    const outputTensor = yoloTransforms.transpose(
      originalOutput,
      [0, 2, 1]
    );

    // postprocessing
    const { createCanvas, loadImage } = require('canvas')
    const canvas = createCanvas(imageSize, imageSize)
    const ctx = canvas.getContext('2d')
    loadImage('books.jpg').then((image) => {
      ctx.drawImage(image, 0, 0, imageSize, imageSize)
    })

    const boxes = await yolo.postprocess(outputTensor);
    boxes.forEach((box) => {
      const { top, left, bottom, right, classProb, className } = box;
      console.log(`${top} ${left} ${bottom} ${right} ${classProb} ${className}`)
      ctx.beginPath();
      ctx.rect(left, top, right-left, bottom-top);
      ctx.stroke();
    });

    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync("./output.png", buffer);

  } catch (e) {
    console.error(e)
    alert("Model is not valid!");
  }
}

async function getImageData(filename: string) {
  const { createCanvas, loadImage } = require('canvas')
  const canvas = createCanvas(imageSize, imageSize)
  const ctx = canvas.getContext('2d')
  return loadImage(filename).then((image) => {
    ctx.drawImage(image, 0, 0, imageSize, imageSize)
    const imageData = ctx.getImageData(0, 0, imageSize, imageSize);
    return {
      data: imageData.data,
      width: imageSize,
      height: imageSize
    }
  })
}

async function run() {
  let modelData;
  try {
    modelData = fs.readFileSync('spine.onnx');
  } catch (err) {
    console.error(err);
  }

  let image = await getImageData('books-640.jpg')

  let cpuSession = await runModelUtils.createModelCpu(modelData);
  let session = cpuSession;
  
  runModelUtils.warmupModel(session, [1, 3, imageSize, imageSize]);

  const inputTensor = preprocess(image)

  let inferenceTime
  let outputTensor: Tensor;
  [outputTensor, inferenceTime] = await runModelUtils.runModel(
    session,
    inputTensor
  );

  postprocess(outputTensor, inferenceTime);

}

run();