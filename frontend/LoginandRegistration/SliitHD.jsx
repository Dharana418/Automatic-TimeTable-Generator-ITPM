import sliitHDImage from "../src/assets/SliitHD.jpg";

const SliitHD = () => {
  return (
    <aside className="sliit-hd-section">
      <img
        src={sliitHDImage}
        alt="SLIIT HD"
        className="sliit-hd-image"
      />
      <div className="sliit-hd-overlay">
      </div>
    </aside>
  );
};

export default SliitHD;
