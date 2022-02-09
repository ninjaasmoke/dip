import React, { useEffect, useState, useRef } from 'react';
import './App.css';
import Image from 'image-js';
import Loader from './Loader';
import { info } from './data/info';
import { ReactComponent as Up } from './icons/up.svg';

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
];

const edgeDetectors = [
  'Black Hat',
  'Top Hat',
  'Sobel',
  'Sobel Grey',
  'Canny Edge',
]

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

async function topHat() {
  let image = await Image.load(document.getElementById('color').src);
  image = image.grey();
  let im = image.topHat();
  document.getElementById('result').src = im.toDataURL();
}

async function blackHat() {
  let image = await Image.load(document.getElementById('color').src);
  image = image.grey();
  let im = image.blackHat();
  document.getElementById('result').src = im.toDataURL();
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
map.set('Black Hat', blackHat);
map.set('Top Hat', topHat);

async function applyFilter(filter, setState, scroll = true) {
  setState(States[0]);
  try {
    map.get(filter)().then(() => {
      if (scroll) {
        var element = document.getElementById('main');
        var headerOffset = 40;
        var elementPosition = element.getBoundingClientRect().top;
        var offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
      setState(States[1]);
    })
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

  useEffect(() => {
    applyFilter(selectedFilter, setState, false);
  }, []);

  const [scrollDir, setScrollDir] = useState("");

  useEffect(() => {
    const threshold = 60;
    let lastScrollY = window.pageYOffset;
    let ticking = false;

    const updateScrollDir = () => {
      const scrollY = window.pageYOffset;

      if (Math.abs(scrollY - lastScrollY) < threshold) {
        ticking = false;
        return;
      }
      setScrollDir(scrollY > lastScrollY ? "scrolling down" : "scrolling up");
      lastScrollY = scrollY > 0 ? scrollY : 0;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDir);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll);

    return () => window.removeEventListener("scroll", onScroll);
  }, [scrollDir]);


  return (
    <div className='container' id="home">
      <nav>
        <h3>
          Digital Image Processing
        </h3>
      </nav>

      {
        scrollDir === "scrolling down" && <div className="slide-nav">
          Digital Image Processing
        </div>
      }

      <>
        {
          OptionNames(filterNames, selectedFilter, setSelectedFilter, setState, "Filters")
        }
        {
          OptionNames(edgeDetectors, selectedFilter, setSelectedFilter, setState, "Edge Detectors")
        }
      </>

      <div className='inputs'>
        <input type="text" id="newurl" placeholder='enter new image url' ref={inputRef} />
        <button onClick={() => {
          if (isValidHttpUrl(inputRef.current.value)) {
            setImgUrl(inputRef.current.value);
            setTimeout(async () => {
              await applyFilter(selectedFilter, setState);
            }, 100);
          }
        }}>
          Load
        </button>
      </div>

      <main id='main'>
        <div className='title' id={selectedFilter ?? ""}>
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
        {info[selectedFilter] && <>
          <br />
          <h4>What does it mean?</h4>
          <br />
        </>
        }
        {
          info[selectedFilter] && getInfo(selectedFilter)
        }
      </main>

      {
        scrollDir == "scrolling down" && <div className='up' onClick={() => {
          document.getElementById("home").scrollIntoView({ behavior: "smooth" });
        }}><Up /></div>
      }

      <footer>
        <h4>
          project by <a href="https://github.com/ninjaasmoke">Nithin</a>
        </h4>
      </footer>
    </div>
  );
}

export default App;


function OptionNames(names, selectedFilter, setSelectedFilter, setState, title) {
  return (
    <div className="filters">
      {title && <h4 className='filter-title'>{title}</h4>}
      {names.map(filterName => (
        <span
          key={filterName}
          className={selectedFilter == filterName ? "filterName selected" : "filterName"}
          onClick={async () => {
            await applyFilter(filterName, setState, selectedFilter);
            setSelectedFilter(filterName);
          }}
        >
          {filterName}
        </span>
      ))}
    </div>
  );
}

function getInfo(filterName) {
  return (
    <p className="info">
      {info[filterName].split("\n").map((line, i) => <span key={i}>{line}<br /></span>)}
    </p>
  )
}