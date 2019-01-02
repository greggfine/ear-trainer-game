/*!
 * Interval Game v1.0.0
 * Copyright 2018 
 *
 * Freely distributable under the MIT license.
 *
 * Full details and documentation:
 * http://greggfine.github.io/
 */

(function() {

"use strict";

let count = 0, count2 = 0;
let randomlySelectedNoteName;
const guessButtonsArr = [];
const guessButtons = document.querySelectorAll('.guess-button');
guessButtons.forEach(guessBtn => guessButtonsArr.push(guessBtn));

const context = new (window.AudioContext || window.webkitAudioContext)();
let oscType;
let gainLevel = .6;
const numPoints = document.getElementById('num-points');
const totalCount = document.getElementById('total-count');
// const gainSlider = document.getElementById('gain-slider');
const frequencyChooser = document.getElementById('frequency-chooser');
let userSelectedFrequency;
const result = document.getElementById('result');
const waveformSelector = document.querySelector('.waveform-selector');
const randomIntButton = document.getElementById('random-int-button');
const frequencyMap = {
  'c3': 130.81,
  'd3': 146.83,
  'e3': 164.81,
  'f3': 174.61,
  'g3': 196.00,
  'a3': 220.00,
  'b3': 246.94,
  'c4': 261.63,
  'c#4':277.18,  
  'd4': 293.66,
  'd#4':311.13,
  'e4': 329.63,
  'f4': 349.23,
  'f#4':185.00,
  'g4': 392.00,
  'g#4':207.65,
  'a4': 440.00,
  'a#4':466.16,
  'b4': 493.88,
  'c5': 523.25,
}

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
    this.gainNode.gain.exponentialRampToValueAtTime(0.100, time + 1);
    this.oscillator.stop(time + 1);
  }
}

waveformSelector.addEventListener('click', e => oscType = e.target.id);

let valueGainDial = document.getElementById("gainDial").value;

$(".dial").knob({
  change: function(valueGainDial) {
    console.log(gainLevel)
    gainLevel = valueGainDial;
  }
});

frequencyChooser.addEventListener('change', function(e) { 
  userSelectedFrequency = e.target.value;
})

randomIntButton.addEventListener('click', noteGenerator);

function noteGenerator() {
   //generates a random answer from the freqMap Obj, 
      let randomlySelectedFreq = _.sample(frequencyMap, 1);
      randomlySelectedNoteName = (_.invert(frequencyMap))[randomlySelectedFreq]; 

      reset();

      playNote(randomlySelectedFreq, randomlySelectedNoteName);

      //Generates new array for buttons with unique frequencies(passes in the correct answer note)

      generateUniqueFreq(randomlySelectedNoteName);
}

function playNote(randomlySelectedFreq, randomlySelectedNoteName) {
        let note = new Sound(context, oscType, gainLevel);
        let now = context.currentTime;

      //Starting note and new random note are triggered
      note.play(frequencyMap[userSelectedFrequency] || frequencyMap.c4, now);
      note.play(randomlySelectedFreq, now + 1);
    }

guessButtons.forEach(guessBtn => {
          let note = new Sound(context, oscType, gainLevel);
                     
          guessBtn.addEventListener('click', function() {
             if (this.textContent === randomlySelectedNoteName) {
                    this.style.backgroundColor = 'lightGreen';
                    resultMessage('yes');
                    incrementCounter();
                    incrementTotalCount();
                    let now = context.currentTime;
                    note.play(frequencyMap[this.textContent], now);
               } else {
                   this.style.backgroundColor = 'red';
                    resultMessage('no');
                    incrementTotalCount();
                    let now = context.currentTime;
                    note.play(frequencyMap[this.textContent], now);
               }
          })})

function reset() {
      guessButtons.forEach(guessButton => guessButton.style.backgroundColor = '#eee');
      result.textContent = '';
}

function resultMessage(answer) {
    if (answer === 'yes') {
                 result.textContent = 'Correct!';
                 result.style.backgroundColor = 'lightGreen';  
               } else {
                 result.textContent = 'Wrong!';
                 result.style.backgroundColor = 'red';
      }
}

function incrementCounter() {
  numPoints.textContent = ++count;
}

function incrementTotalCount() {
  totalCount.textContent = ++count2;
  if(count2 === 10) {
      count2 = 0;
      count = 0;
    }
}

function generateUniqueFreq(randomlySelectedNoteName) {
    const uniqueFreqs = [randomlySelectedNoteName];

    while(uniqueFreqs.length < 6) {
           let randomFreq = _.sample(frequencyMap, 1);
           let noteName = (_.invert(frequencyMap))[randomFreq];
             if(!uniqueFreqs.includes(noteName)) {
               uniqueFreqs.push(noteName);
             }
    }

   let shuffledArr = _.shuffle(uniqueFreqs);

   guessButtonsArr.forEach((answer, index) => answer.textContent = shuffledArr[index]);

}
}());
