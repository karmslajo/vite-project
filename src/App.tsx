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
              url: "https://d3bgr8rt92bail.cloudfront.net/optimized/media/372/1888/0/0/379a3c5d-c007-4ff4-b3f5-1226c05533aa.png",
              // url: "https://d3bgr8rt92bail.cloudfront.net/original/frames/e1ad522c-ff72-4717-b7b4-31d01905295f.png",
              frameWidth: 1080,
              frameHeight: 721,
              outlineWidth: 744,
              outlineHeight: 496,
              outlineLeft: 248,
              outlineTop: 131,
            },
            portrait: {
              url: "https://d3bgr8rt92bail.cloudfront.net/optimized/media/372/1888/0/0/2f9bfdfc-6d71-4f7d-83ff-076eb1c2a8e8.png",
              // url: "https://d3bgr8rt92bail.cloudfront.net/original/frames/b86891a1-40ac-42cd-8fe8-38a545824ec4.png",
              frameWidth: 721,
              frameHeight: 1080,
              outlineWidth: 496,
              outlineHeight: 744,
              outlineLeft: 112,
              outlineTop: 169,
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
