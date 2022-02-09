import { useLayoutEffect, useState, useRef } from 'react';
import './App.css';
import Image from 'image-js';
import Loader from './Loader';

const States = ["loading", "default", "error"];

function isValidHttpUrl(string) {
  let url;

  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }

  return url.protocol === "http:" || url.protocol === "https:";
}

const filterNames = [
  'Grey Scale',
  'Invert',
  'Mask',
  'Region of Interest (Blue)',
  'Region of Interest (Yellow)',
  'Blur',
  'Gaussian Blur',
  'Sobel',
  'Sobel Grey',
  'Canny Edge',
];

async function greyFilter() {
  let image = await Image.load(document.getElementById('color').src);
  let im = image.grey();
  document.getElementById('result').src = im.toDataURL();
}

async function sobelFilter(grey) {
  let image = await Image.load(document.getElementById('color').src);
  if (grey) {
    image = image.grey();
  }
  let im = image.sobelFilter();
  document.getElementById('result').src = im.toDataURL();
}

async function roi(color = 'blue') {
  let image = await Image.load(document.getElementById('color').src);

  let grey = image.grey();
  let yellow = image.grey({ algorithm: color });
  let mask = yellow.mask();
  let roiManager = image.getRoiManager();
  roiManager.fromMask(mask);
  var rois = roiManager.getRois({ negative: false, minSurface: 100 })
  var roisMasks = rois.map((roi) => roi.getMask({ kind: 'filled' }));
  let result = grey.rgba8().paintMasks(roisMasks, { color: color });
  document.getElementById('result').src = result.toDataURL();
}

async function mask() {
  let image = await Image.load(document.getElementById('color').src);
  let yellow = image.grey();
  let result = yellow.mask();
  document.getElementById('result').src = result.toDataURL();
}

async function blurFilter() {
  let image = await Image.load(document.getElementById('color').src);
  let im = image.blurFilter({
    radius: 4,
  });
  document.getElementById('result').src = im.toDataURL();
}

async function gaussianFilter() {
  let image = await Image.load(document.getElementById('color').src);
  let im = image.gaussianFilter({
    radius: 4,
  });
  document.getElementById('result').src = im.toDataURL();
}

async function cannyEdgeDetection() {
  let image = await Image.load(document.getElementById('color').src);
  image = image.grey();
  let im = image.cannyEdge();
  document.getElementById('result').src = im.toDataURL();
}

async function invert() {
  let image = await Image.load(document.getElementById('color').src);
  let im = image.invert();
  document.getElementById('result').src = im.toDataURL();
}

async function getHistogramData(imgId) {
  let image = await Image.load(document.getElementById(imgId).src);
  try {
    let histogram = image.getHistograms();
    console.log(histogram);
    return histogram;
  } catch (e) {
    let histogram = image.getHistograms();
    console.log(histogram);
    return histogram;
  }
}

const map = new Map();
map.set('Grey Scale', greyFilter);
map.set('Sobel', sobelFilter);
map.set('Sobel Grey', () => sobelFilter(true));
map.set('Region of Interest (Blue)', () => roi('blue'));
map.set('Region of Interest (Yellow)', () => roi('yellow'));
map.set('Mask', mask);
map.set('Blur', blurFilter);
map.set('Gaussian Blur', gaussianFilter);
map.set('Canny Edge', cannyEdgeDetection);
map.set('Invert', invert);

async function applyFilter(filter, setState) {
  setState(States[0]);
  try {
    await map.get(filter)();
    window.scrollTo(0, document.body.scrollHeight);
    setState(States[1]);
  } catch (e) {
    console.log(e);
    setState(States[2]);
  }

}

function App() {

  const [imgUrl, setImgUrl] = useState("https://images.unsplash.com/photo-1541535650810-10d26f5c2ab3?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=720&q=100");

  const [selectedFilter, setSelectedFilter] = useState(filterNames[0]);
  const [rawData, setRawData] = useState([]);
  const [state, setState] = useState(States[1]);

  const inputRef = useRef("");

  useLayoutEffect(() => {
    greyFilter();
  }, []);


  return (
    <div className='container'>
      <nav>
        <h3>
          Digital Image Processing
        </h3>
      </nav>

      <div className="filters">
        {filterNames.map(filterName => (
          <span
            key={filterName}
            className={selectedFilter == filterName ? "filterName selected" : "filterName"}
            onClick={async () => {
              setSelectedFilter(filterName);
              await applyFilter(filterName, setState);
            }}
          >
            {filterName}
          </span>
        ))}
      </div>

      <div className='inputs'>
        <input type="text" id="newurl" placeholder='enter new image url' ref={inputRef} />
        <button onClick={() => {
          if (isValidHttpUrl(inputRef.current.value)) {
            setImgUrl(inputRef.current.value);
            setTimeout(() => {
              applyFilter(selectedFilter, setState);
            }, 100);
          }
        }}>
          Load
        </button>
      </div>

      <main>
        <div className='title'>
          <h4>{selectedFilter ?? ""}</h4>
          {
            state == States[0] && <Loader />
          }
          {
            state == States[2] && <div className="error">(Error)</div>
          }
        </div>
        <section>
          <img id="color"
            src={imgUrl} />
          <img id='result' />
        </section>
      </main>

      <footer>
        <h4>
          project by <a href="https://github.com/ninjaasmoke">Nithin</a>
        </h4>
      </footer>
    </div>
  );
}

export default App;
