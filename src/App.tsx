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
              // url: 'https://storage.gump.local/original/frames/efbf6a50-b791-4fef-a7d7-e8876ff96c3e.png'
            },
            portrait: {
              url: "https://d3bgr8rt92bail.cloudfront.net/optimized/media/18/1888/0/0/c3fe2982-9899-4666-8b39-8fe5fc1917f4.png",
              // url: 'https://storage.gump.local/original/frames/7ed319ef-2781-42cb-8bb2-d341d70d5d29.png'
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
