import "./App.css";
import { FrameCamera } from "./app/components/take-photo-with-frame";
import { WebToMobile } from "./app/components/web-to-mobile";

function App() {
  const display: string = "camera";

  return (
    <>
      {display === "webMobileFlow" && <WebToMobile />}
      {display === "camera" && (
        <FrameCamera
          frame={{
            id: "1",
            name: "frame",
            landscape: {
              url: "https://d3bgr8rt92bail.cloudfront.net/optimized/media/18/1888/0/0/15910f61-e531-4b38-a2d6-8e8e1a4842d7.png",
            },
            portrait: {
              url: "https://d3bgr8rt92bail.cloudfront.net/optimized/media/18/1888/0/0/c3fe2982-9899-4666-8b39-8fe5fc1917f4.png",
            },
            hashtags: ["#frame"],
          }}
          onClose={() => {}}
        />
      )}
    </>
  );
}

export default App;
