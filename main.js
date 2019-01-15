/* Copyright 2013 Chris Wilson
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

/*
This monkeypatch library is intended to be included in projects that are
written to the proper AudioContext spec (instead of webkitAudioContext),
and that use the new naming and proper bits of the Web Audio API (e.g.
using BufferSourceNode.start() instead of BufferSourceNode.noteOn()), but may
have to run on systems that only support the deprecated bits.
This library should be harmless to include if the browser supports
unprefixed "AudioContext", and/or if it supports the new names.
The patches this library handles:
if window.AudioContext is unsupported, it will be aliased to webkitAudioContext().
if AudioBufferSourceNode.start() is unimplemented, it will be routed to noteOn() or
noteGrainOn(), depending on parameters.
The following aliases only take effect if the new names are not already in place:
AudioBufferSourceNode.stop() is aliased to noteOff()
AudioContext.createGain() is aliased to createGainNode()
AudioContext.createDelay() is aliased to createDelayNode()
AudioContext.createScriptProcessor() is aliased to createJavaScriptNode()
AudioContext.createPeriodicWave() is aliased to createWaveTable()
OscillatorNode.start() is aliased to noteOn()
OscillatorNode.stop() is aliased to noteOff()
OscillatorNode.setPeriodicWave() is aliased to setWaveTable()
AudioParam.setTargetAtTime() is aliased to setTargetValueAtTime()
This library does NOT patch the enumerated type changes, as it is
recommended in the specification that implementations support both integer
and string types for AudioPannerNode.panningModel, AudioPannerNode.distanceModel
BiquadFilterNode.type and OscillatorNode.type.
*/
(function (global, exports, perf) {
  'use strict';

  function fixSetTarget(param) {
    if (!param)	// if NYI, just return
      return;
    if (!param.setTargetAtTime)
      param.setTargetAtTime = param.setTargetValueAtTime;
  }

  if (window.hasOwnProperty('webkitAudioContext') &&
    !window.hasOwnProperty('AudioContext')) {
    window.AudioContext = webkitAudioContext;

    if (!AudioContext.prototype.hasOwnProperty('createGain'))
      AudioContext.prototype.createGain = AudioContext.prototype.createGainNode;
    if (!AudioContext.prototype.hasOwnProperty('createDelay'))
      AudioContext.prototype.createDelay = AudioContext.prototype.createDelayNode;
    if (!AudioContext.prototype.hasOwnProperty('createScriptProcessor'))
      AudioContext.prototype.createScriptProcessor = AudioContext.prototype.createJavaScriptNode;
    if (!AudioContext.prototype.hasOwnProperty('createPeriodicWave'))
      AudioContext.prototype.createPeriodicWave = AudioContext.prototype.createWaveTable;


    AudioContext.prototype.internal_createGain = AudioContext.prototype.createGain;
    AudioContext.prototype.createGain = function () {
      var node = this.internal_createGain();
      fixSetTarget(node.gain);
      return node;
    };

    AudioContext.prototype.internal_createDelay = AudioContext.prototype.createDelay;
    AudioContext.prototype.createDelay = function (maxDelayTime) {
      var node = maxDelayTime ? this.internal_createDelay(maxDelayTime) : this.internal_createDelay();
      fixSetTarget(node.delayTime);
      return node;
    };

    AudioContext.prototype.internal_createBufferSource = AudioContext.prototype.createBufferSource;
    AudioContext.prototype.createBufferSource = function () {
      var node = this.internal_createBufferSource();
      if (!node.start) {
        node.start = function (when, offset, duration) {
          if (offset || duration)
            this.noteGrainOn(when || 0, offset, duration);
          else
            this.noteOn(when || 0);
        };
      } else {
        node.internal_start = node.start;
        node.start = function (when, offset, duration) {
          if (typeof duration !== 'undefined')
            node.internal_start(when || 0, offset, duration);
          else
            node.internal_start(when || 0, offset || 0);
        };
      }
      if (!node.stop) {
        node.stop = function (when) {
          this.noteOff(when || 0);
        };
      } else {
        node.internal_stop = node.stop;
        node.stop = function (when) {
          node.internal_stop(when || 0);
        };
      }
      fixSetTarget(node.playbackRate);
      return node;
    };

    AudioContext.prototype.internal_createDynamicsCompressor = AudioContext.prototype.createDynamicsCompressor;
    AudioContext.prototype.createDynamicsCompressor = function () {
      var node = this.internal_createDynamicsCompressor();
      fixSetTarget(node.threshold);
      fixSetTarget(node.knee);
      fixSetTarget(node.ratio);
      fixSetTarget(node.reduction);
      fixSetTarget(node.attack);
      fixSetTarget(node.release);
      return node;
    };

    AudioContext.prototype.internal_createBiquadFilter = AudioContext.prototype.createBiquadFilter;
    AudioContext.prototype.createBiquadFilter = function () {
      var node = this.internal_createBiquadFilter();
      fixSetTarget(node.frequency);
      fixSetTarget(node.detune);
      fixSetTarget(node.Q);
      fixSetTarget(node.gain);
      return node;
    };

    if (AudioContext.prototype.hasOwnProperty('createOscillator')) {
      AudioContext.prototype.internal_createOscillator = AudioContext.prototype.createOscillator;
      AudioContext.prototype.createOscillator = function () {
        var node = this.internal_createOscillator();
        if (!node.start) {
          node.start = function (when) {
            this.noteOn(when || 0);
          };
        } else {
          node.internal_start = node.start;
          node.start = function (when) {
            node.internal_start(when || 0);
          };
        }
        if (!node.stop) {
          node.stop = function (when) {
            this.noteOff(when || 0);
          };
        } else {
          node.internal_stop = node.stop;
          node.stop = function (when) {
            node.internal_stop(when || 0);
          };
        }
        if (!node.setPeriodicWave)
          node.setPeriodicWave = node.setWaveTable;
        fixSetTarget(node.frequency);
        fixSetTarget(node.detune);
        return node;
      };
    }
  }

  if (window.hasOwnProperty('webkitOfflineAudioContext') &&
    !window.hasOwnProperty('OfflineAudioContext')) {
    window.OfflineAudioContext = webkitOfflineAudioContext;
  }

// }(window));

// (function() {

//   "use strict";

  let count = 0,
    count2 = 0;
  let randomlySelectedNoteName;
  const guessButtonsArr = [];
  const guessButtons = document.querySelectorAll(".guess-button");

  // Should I convert this to an ARRAY first???
  guessButtons.forEach(guessBtn => {
    // guessBtn =  <button class = "guess-button"></button>
    guessButtonsArr.push(guessBtn);
  });

  const context = new window.AudioContext();
  // const context = new (window.AudioContext || window.webkitAudioContext)();
  let oscType;
  let gainLevel = 0.6;
  const numPoints = document.getElementById("num-points");
  const totalCount = document.getElementById("total-count");
  // const gainSlider = document.getElementById('gain-slider');
  const frequencyChooser = document.getElementById("frequency-chooser");
  let userSelectedFrequency;
  const result = document.getElementById("result");
  const waveformSelector = document.querySelector(".waveform-selector");
  const randomIntButton = document.getElementById("random-int-button");

  // SHOULD ALL OF THESE BE IN QUOTES?
  const frequencyMap = { c3: 130.81, d3: 146.83, e3: 164.81, f3: 174.61, g3: 196.0, a3: 220.0, b3: 246.94, c4: 261.63, "c#4": 277.18, d4: 293.66, "d#4": 311.13, e4: 329.63, f4: 349.23, "f#4": 185.0, g4: 392.0, "g#4": 207.65, a4: 440.0, "a#4": 466.16, b4: 493.88, c5: 523.25 };


var playState = false;




  // =================  WEB AUDIO API CONTEXT CLASS ======================
  // This Object creates a new Web Audio API Context
  // It takes an oscillator type and a gain level
  // We call init() to create oscillator/gain and wire it up to our audio outputs
  // We have "play" and "stop" methods to play the sound
  class Sound {
    constructor(context, oscType, gainLevel) {
      this.context = context;
      this.oscType = oscType;
      this.gainLevel = gainLevel;
    }

    init() {
      this.oscillator = this.context.createOscillator();
      this.gainNode = this.context.createGain();

      this.oscillator.connect(this.gainNode);
      this.gainNode.connect(this.context.destination);
      this.oscillator.type = this.oscType;
    }

    play(value, time) {
      this.init();

      this.oscillator.frequency.value = value;
      this.gainNode.gain.value = this.gainLevel;
      // this.gainNode.gain.setValueAtTime(1, this.context.currentTime);


        this.oscillator.start(time);
        this.stop(time);

    }
    
    stop(time) {
      this.gainNode.gain.exponentialRampToValueAtTime(0.1, time + 1);
      this.oscillator.stop(time + 1);
    }
    
  }

  // =================  WEB AUDIO API CONTEXT CLASS ======================






  // =================  SVG WAVEFORM SELECT ======================

  // waveformSelector is the SVG waveform chooser
  // When we click a waveform, we assign event.target.id(sine, triangle, square, sawtooth) to "oscType"
  waveformSelector.addEventListener("click", event => {
    oscType = event.target.id;
  });

  // =================  SVG WAVEFORM SELECT ======================






  // =================  GAIN SLIDER ======================

  var gainSlider = document.getElementById("gainSlider")
                           .addEventListener('change', function () {
                              gainLevel = this.value;
                            })

  // =================  GAIN SLIDER ======================







  // =================  Starting FREQUENCY Select ======================
  // When the user selects a Starting Frequency, we assign it to "userSelectedFrequency"

  frequencyChooser.addEventListener("change", function(e) {
    userSelectedFrequency = e.target.value;
  });

  // =================  Starting FREQUENCY Select ======================





  // When "PLAY RANDOM INTERVAL"  button is clicked, we execute "noteGenerator" function
  randomIntButton.addEventListener('click', () => {
        var classes = ['visible-correct', 'visible-wrong'];
        result.classList.remove(...classes);
        noteGenerator()
  });

  function noteGenerator() {
    //generates a random answer from the freqMap Obj,
    //  We call the "sample" method from UNDERSCORE
    //  "Sample" takes an OBJECT("frequencyMap") and returns n(2nd argument) number of random elements from the OBJECT
    // "frequencyMap" is an Object with:  note name as property and hertz(floating point number) as value
    // "randomlySelectedFreq" is a Floating Point Number,  Ex.: 207.65
        let randomlySelectedFreq = _.sample(frequencyMap, 1);
        

    // UNDERSCORE's "Invert" method: takes the object("frequencyMap") and swaps its property and values
    // So, "frequencyMap" object now has floating point numbers as properties
    // We find the value(note name) in the inverted object and assign it to "randomlySelectedNoteName"
    // randomlySelecteNoteName is a string:  Ex. "c4"
        randomlySelectedNoteName = (_.invert(frequencyMap))[randomlySelectedFreq];

      // When we click "PLAY RANDOM INTERVAL" button, 
      //    "reset()" sets the button background color back to grey, after an answer has been selected
      reset();

      // We call the "playNote" function and pass in, for ex., 207.65 and 'c4'
      playNote(randomlySelectedFreq);
      // playNote(randomlySelectedFreq, randomlySelectedNoteName);

      //Generates new array for buttons with unique frequencies(passes in the correct answer note)

      generateUniqueFreq(randomlySelectedNoteName);
}


  // GENERATE a new NOTE
  function playNote(randomlySelectedFreq) {
  // function playNote(randomlySelectedFreq, randomlySelectedNoteName) {
          let note = new Sound(context, oscType, gainLevel);
          let note2 = new Sound(context, oscType, gainLevel);
          let now = context.currentTime;

        //Starting note and new random note are triggered
        // We play a note from the "frequencyMap" object starting with 
        //      either the "userSelected Frequency" or, default to "c4"
        if(!playState) {
          playState = !playState;
          note.play(frequencyMap[userSelectedFrequency] || frequencyMap.c4, now);
        }

        // Then, we play our Randomly Selected Note
        note2.play(randomlySelectedFreq, now + 1);
        // note.play(randomlySelectedFreq, now + 1);
  }



  function reset() {
    guessButtons.forEach(guessButton => guessButton.style.backgroundColor = '#eee');
  }




  function generateUniqueFreq(randomlySelectedNoteName) {
    // "uniqueFreqs": ex., ["f3"]
    const uniqueFreqs = [randomlySelectedNoteName];

    while (uniqueFreqs.length < 6) {
      let randomFreq = _.sample(frequencyMap, 1);
      let noteName = (_.invert(frequencyMap))[randomFreq];
      if (!uniqueFreqs.includes(noteName)) {
        uniqueFreqs.push(noteName);
      }
    }

    // Uses UNDERSCORE's "shuffle" method to return a shuffled/permutated copy of the list
    let shuffledArr = _.shuffle(uniqueFreqs);

    guessButtonsArr.forEach((answer, index) => answer.textContent = shuffledArr[index]);

  }






  guessButtons.forEach(guessBtn => {
            let note = new Sound(context, oscType, gainLevel);

            guessBtn.addEventListener('click', function() {
              playState = !playState;
                if (this.textContent === randomlySelectedNoteName) {
                      this.style.backgroundColor = 'lightGreen';
                      resultMessage('yes');
                      // incrementCounter();
                      // incrementTotalCount();
                      let now = context.currentTime;
                        note.play(frequencyMap[this.textContent], now);
                  } else {
                      this.style.backgroundColor = 'red';
                      resultMessage('no');
                      // incrementTotalCount();
                      let now = context.currentTime;
                      note.play(frequencyMap[this.textContent], now);
                  }
            })})



  function resultMessage(answer) {
    if (answer === 'yes') {
                    result.classList.add('visible-correct');
                    result.textContent = 'Correct!';
                  } else {
                    result.classList.add('visible-wrong');
                    result.textContent = 'Wrong!';
        }
  }

  // function incrementCounter() {
  //   numPoints.textContent = ++count;
  // }

  // function incrementTotalCount() {
  //   totalCount.textContent = ++count2;
  //   if(count2 === 10) {
  //       count2 = 0;
  //       count = 0;
  //     }
  // }

}(window));
// }());
