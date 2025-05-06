from ultralytics import YOLO


def main():
    print("Hello from book-spine-model-to-onnx!")
    model = YOLO("spine.pt")
    print(model)
    model.export(format="onnx")

if __name__ == "__main__":
    main()
