(function () {
  'use strict';

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

  // const context = new window.AudioContext();
  const context = new (window.AudioContext || window.webkitAudioContext)();
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

}());


