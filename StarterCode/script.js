'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputTemp = document.querySelector('.form__input--temp');
const inputClimb = document.querySelector('.form__input--climb');
// let map, mapEvent;

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);

  clickNumber = 0;

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance; // km
    this.duration = duration; // min
  }

  _setDescription() {
    this.type === 'running'
      ? (this.description = `Пробежка ${new Intl.DateTimeFormat('ru-Ru').format(
          this.date
        )}`)
      : (this.description = `Велотренеровка ${new Intl.DateTimeFormat(
          'ru-Ru'
        ).format(this.date)}`);
  }

  click() {
    this.clickNumber++;
  }
}

class Running extends Workout {
  type = 'running';

  constructor(coords, distance, duration, temp) {
    super(coords, distance, duration);
    this.temp = temp;
    this.calculatePace();
    this._setDescription();
  }

  calculatePace() {
    //  min/km
    this.pace = this.duration / this.distance;
  }
}
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, climb) {
    super(coords, distance, duration);
    this.climb = climb;
    this.calculateSpeed();
    this._setDescription();
  }

  calculateSpeed() {
    //  km/h
    this.speed = this.distance / this.duration / 60;
  }
}

// coords, distance, duration, temp
// const running = new Running([50, 44], 7, 40, 170);
// const cycling = new Cycling([50, 44], 36, 88, 370);
// console.log(running);
// console.log(cycling);

class App {
  //private fields
  #map;
  #mapEvent;
  #workouts = [];

  constructor() {
    // get geo data user
    this._getPosition();

    // get data from local storage
    this._getLocalStorageData();

    // add handles
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleClimbField);
    containerWorkouts.addEventListener('click', this._moveToWorkout.bind(this));
  }
  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Невозможно получить ваше местоположене');
        }
      );
    }
  }
  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    // console.log(`https://www.google.com/maps/@${latitude},${longitude},11z`);

    const coords = [latitude, longitude];

    // console.log(this);
    this.#map = L.map('map').setView(coords, 15);
    // console.log(map);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));

    // show trainy from local storage on map
    this.#workouts.forEach(workout => {
      this._displayWorkout(workout);
    });
  }

  _showForm(e) {
    this.#mapEvent = e;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputTemp.value =
      inputClimb.value =
        '';
    form.classList.add('hidden');
  }

  _toggleClimbField() {
    inputClimb.closest('.form__row').classList.toggle('form__row--hidden');
    inputTemp.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    const areNumbers = (...numbers) =>
      numbers.every(num => Number.isFinite(num));

    const areNumberPositive = (...numbers) => numbers.every(num => num > 0);

    e.preventDefault();

    const { lat, lng } = this.#mapEvent.latlng;

    let workout;

    // get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;

    // if train ranning = new Running
    if (type === 'running') {
      const temp = +inputTemp.value;
      // check valid date
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(temp)
        !areNumbers(distance, duration, temp) ||
        !areNumberPositive(distance, duration, temp)
      )
        return alert('Введите положительное число!');

      workout = new Running([lat, lng], distance, duration, temp);
    }

    // if train cycle = new Cycle
    if (type === 'cycling') {
      const climb = +inputClimb.value;
      // check valid date
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(climb)
        !areNumbers(distance, duration, climb) ||
        !areNumberPositive(distance, duration)
      )
        return alert('Введите положительное число!');

      workout = new Cycling([lat, lng], distance, duration, climb);
    }

    // add new obj in arr training
    this.#workouts.push(workout);
    // console.log(workout);

    // show train on the map
    this._displayWorkout(workout);

    // show train in the list
    this._displayWorkoutOnSidebar(workout);

    // clear input
    this._hideForm();

    // add all to localstorage
    this._addWorkoutsToLocalStorage();
  }

  _displayWorkout(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 350,
          minWidth: 50,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃' : '🚵‍♂️'} ${workout.description}`
      )
      .openPopup();
  }

  _displayWorkoutOnSidebar(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃' : '🚵‍♂️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">км</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">мин</span>
          </div>
    `;

    if (workout.type === 'running') {
      html += `
      <div class="workout__details">
            <span class="workout__icon">📏⏱</span>
            <span class="workout__value">${workout.pace.toFixed(2)}</span>
            <span class="workout__unit">мин/км</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">👟⏱</span>
            <span class="workout__value">${workout.temp}</span>
            <span class="workout__unit">шаг/мин</span>
          </div>
      </li>
      `;
    }

    if (workout.type === 'cycling') {
      html += `
      <div class="workout__details">
            <span class="workout__icon">📏⏱</span>
            <span class="workout__value">${workout.speed.toFixed(2)}</span>
            <span class="workout__unit">км/ч</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🏔</span>
            <span class="workout__value">${workout.climb}</span>
            <span class="workout__unit">м</span>
          </div>
      </li>
        `;
    }

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToWorkout(e) {
    const workoutElement = e.target.closest('.workout');
    // console.log(workoutElement);

    if (!workoutElement) return; // if = 0 we will be return

    const workout = this.#workouts.find(
      item => item.id === workoutElement.dataset.id
    );

    this.#map.setView(workout.coords, 13, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    // workout.click();
    // console.log(workout);
  }

  _addWorkoutsToLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorageData() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    // console.log(data);

    if (!data) return;

    this.#workouts = data;

    this.#workouts.forEach(workout => {
      this._displayWorkoutOnSidebar(workout);
    });
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload(); // in console app.reset() for object app
  }
}

const app = new App();

// app._getPosition();

// geolocat - 2 callback func - good and error case
// if (navigator.geolocation) {
//   navigator.geolocation.getCurrentPosition(
//     function (position) {
//       // console.log(position);
//       // const latitude = position.coords.latitude;

//       // destructur
//       const { latitude } = position.coords;
//       const { longitude } = position.coords;
//       console.log(`https://www.google.com/maps/@${latitude},${longitude},11z`); // https://www.google.ru/maps/@53.9000832,27.475968,11z  // координаты моего положения 53.9421538 27.6054552

//       const coords = [latitude, longitude];

//       // leaflet
//       map = L.map('map').setView(coords, 15);
//       // console.log(map); // object i we can see many options

//       L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
//         attribution:
//           '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
//       }).addTo(map);

//       // view marker on map in any place
//       // handle click on map
//       map.on('click', function (event) {
//         mapEvent = event;
//         form.classList.remove('hidden');
//         inputDistance.focus();
//         // console.log(mapEvent); // use random click we can see inform(object) in cosole about data-click
//       });
//     },
//     function () {
//       alert('Невозможно получить ваше местоположене');
//     }
//   );
// }

// // push data with keyboard
// form.addEventListener('submit', function (event) {
//   event.preventDefault();

//   // clear input fields data
//   inputDistance.value =
//     inputDuration.value =
//     inputTemp.value =
//     inputClimb.value =
//       '';
//   // to see marker
//   const { lat, lng } = mapEvent.latlng; //  for exmpl latlng: D {lat: 53.946337270312746, lng: 27.60001659393311}
//   // our marker
//   L.marker([lat, lng])
//     .addTo(map)
//     .bindPopup(
//       L.popup({
//         maxWidth: 350,
//         minWidth: 50,
//         autoClose: false,
//         closeOnClick: false,
//         className: 'running-popup',
//       })
//     )
//     .setPopupContent('Im Here!')
//     .openPopup();
// });

// // for input change run vs bike
// inputType.addEventListener('change', function () {
//   inputClimb.closest('.form__row').classList.toggle('form__row--hidden');
//   inputTemp.closest('.form__row').classList.toggle('form__row--hidden');
// });
