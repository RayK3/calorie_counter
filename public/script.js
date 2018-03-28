window.onload = function() {

  var url = 'http://159.89.127.195:8000/';
  //var url = 'http://127.0.0.1:8000/';

  function getCookie(name) {
    var value = "; " + document.cookie;
    if(value.includes(name)) {
      var parts = value.split("; " + name + "=");
      if(parts.length == 2) return parts.pop().split(";").shift();
    }
    else return;
  }

  var calorieCounter = {
    meals: {},
    calories: 0,
    chart: null,
    isGraphed: false,
    guid: getCookie("id"),

    getPreviousCalorieCounter: function() {
      var xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = function() {
        if(xhttp.readyState == 4 && xhttp.status == 200) {
          if(!this.responseText) {
            return;
          } else {
            var previous = JSON.parse(this.responseText);

            calorieCounter['meals'] = previous['meals'];
            calorieCounter['calories'] = previous['calories'];
            calorieCounter['guid'] = previous['guid'];

            calorieCounter.summarizeItems();
            calorieCounter.summarizeMeals();
            calorieCounter.graph();
          }
        }
      }
      xhttp.open("GET", url + "calorie_counter?id=" + this.guid, true);
      xhttp.send();
    },

    updateJSON: function() {
      function guid() {
        function s4() {
          return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
      }

      if(!getCookie("id")) {
        let newGuid = guid();
        document.cookie = "id=" + newGuid;
        this.guid = newGuid;
      }

      var xhttp = new XMLHttpRequest();

      var oldInfo = {
        meals: this.meals,
        calories: this.calories,
        guid: this.guid,
      };

      var params = "id=" + this.guid + "&calorieCounter=" + JSON.stringify(oldInfo);

      xhttp.open("POST", url + 'setGuid', true);

      xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

      xhttp.send(params);

    },

    Meal: function() {
      this.items = {};
      this.calories = 0;
    },

    sumCalories: function() {
      this.calories = 0;
      for(meal in this.meals) {
        this.calories += this.meals[meal].calories;
      }
    },

    addMeal: function(name) {
      this.meals[name] = new this.Meal();
      this.sumCalories();
    },
    removeMeal: function(name) {
      if(!this.meals[name]){
        return false;
      } else {
        delete this.meals[name];
        this.sumCalories();
        return true;
      }
    },


    addItem: function(meal, item) {
      if(!this.meals[meal]) {
        this.meals[meal] = new this.Meal();
      }

      if(this.meals[meal].items[item.name]) {
        this.meals[meal].items[item.name] += item.calories;
        this.meals[meal].calories += item.calories;
      } else {
        this.meals[meal].items[item.name] = item.calories;
        this.meals[meal].calories += item.calories;
      }
      this.sumCalories();
    },
    removeItem: function(meal, itemName) {
      if(!this.meals[meal]) {
        return false;
      } else if(!this.meals[meal].items[itemName]) {
        return false;
      } else {
        this.meals[meal].calories -= this.meals[meal].items[itemName];
        delete this.meals[meal].items[itemName];
        if(Object.keys(this.meals[meal].items).length === 0) {
          delete this.meals[meal];
        }
        this.sumCalories();
        return true;
      }
    },

    summarizeItems: function() {

      var html = '<thead><tr><th>Meal</th><th>Item</th><th>Calories</th></tr></thead><tbody>';


      for(meal in this.meals) {
        for(item in this.meals[meal].items) {
          html += `<tr>
                     <td>${meal}</td>
                     <td>${item}</td>
                     <td>${this.meals[meal].items[item]}</td>
                     <td><button class="removeItemButtons waves-effect btn-flat" data-item="${meal} ${item}">remove</button></td>
                   </tr>`;
        }
      }
      html += '</tbody>';
      itemTable.innerHTML = html;
      var removeItemButtons = document.querySelectorAll(".removeItemButtons");

      removeItemButtons.forEach(function(button) {
        button.addEventListener('click', function() {
          var data = button.getAttribute('data-item');
          var mealAndItem = data.split(' ');

          calorieCounter.removeItem(...mealAndItem);
          calorieCounter.summarizeItems();
          calorieCounter.summarizeMeals();
          calorieCounter.graph();
          calorieCounter.updateJSON();
        });
      });
    },

    summarizeMeals: function() {
      var html = '<thead><tr><th>Meal</th><th>Calories</th></tr></thead><tbody>';

      for(meal in this.meals) {
        html += `<tr>
        <td>${meal}</td>
        <td>${this.meals[meal].calories}</td>
        </tr>`
      }

      html += `<tr>
      <td>Total</td>
      <td>${this.calories}</td>
      </tr>
      </tbody>`;

      calorieTable.innerHTML = html;
    },

    graph: function() {
      var mealItems = [];
      for(meal in this.meals) {
        mealItems.push(this.meals[meal].items);
      }

      var names =  [];
      var calories = [];
      mealItems.forEach(function(meal) {
        for(item in meal) {
          names.push(item);
          calories.push(meal[item]);
        }
      });

      if(!this.isGraphed) {
        console.log('graphing');
        var ctx = document.getElementById('itemBar').getContext('2d');
        var gradient = ctx.createLinearGradient(0, 0, 721, 360);
        gradient.addColorStop(0, '#28d6cf');
        gradient.addColorStop(1, '#6fa6d6');

        this.chart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: names,
            datasets: [{
              label: 'Calories Per Item',
              backgroundColor: gradient,
              data: calories,
            }]
          },
          options: {
            scales: {
              yAxes: [{
                ticks: {
                  beginAtZero: true,
                }
              }]
            }
          }
        });
        this.isGraphed = true;
      } else {
        console.log('updating');
        this.chart.data.labels = names;
        this.chart.data.datasets[0].data = calories;
        this.chart.update();
      }
    },

  };

  const addMealButton = document.getElementById("addMealButton");
  const addMealInput = document.getElementById("addMealInput");
  const addMealErrorMessage = document.getElementById("addMealErrorMessage");

  const removeMealButton = document.getElementById("removeMealButton");
  const removeMealInput = document.getElementById("removeMealInput");
  const removeMealErrorMessage = document.getElementById("removeMealErrorMessage");

  const addItemButton = document.getElementById("addItemButton");
  const newItemMeal = document.getElementById("newItemMeal");
  const newItem = document.getElementById("newItem");
  const newItemCalories = document.getElementById("newItemCalories");
  const addItemErrorMessage = document.getElementById("addItemErrorMessage");

  const itemTable = document.getElementById("itemTable");
  const calorieTable = document.getElementById("calorieTable");

  addMealButton.addEventListener('click', function() {
    if(addMealInput.value === '') {
      addMealErrorMessage.innerHTML = 'There\'s nothing to add';
      addMealErrorMessage.classList.add('active');
      setTimeout(function() {
        addMealErrorMessage.classList.remove('active');
      }, 1500);
    } else if(calorieCounter.meals[addMealInput.value.trim()]) {
        addMealErrorMessage.innerHTML = 'This meal was added already';
        addMealErrorMessage.classList.add('active');
        setTimeout(function() {
          addMealErrorMessage.classList.remove('active');
        }, 1500);
    } else {
      calorieCounter.addMeal(addMealInput.value.trim());
      calorieCounter.summarizeItems();
      calorieCounter.summarizeMeals();
      calorieCounter.updateJSON();
      addMealInput.value = '';
    }
  });

  addMealButton.addEventListener('transitionend', function() {
    if(!addMealErrorMessage.classList.contains('active')) {
      addMealErrorMessage.innerHTML = '';
    }
  });

  removeMealButton.addEventListener('click', function() {
    if(removeMealInput.value === '') {
      removeMealErrorMessage.innerHTML = 'There\'s nothing to remove';
      removeMealErrorMessage.classList.add('active');
      setTimeout(function() {
        removeMealErrorMessage.classList.remove('active');
      }, 1500);
    } else {
      if(calorieCounter.removeMeal(removeMealInput.value.trim())) {
        removeMealInput.value = '';
        calorieCounter.summarizeItems();
        calorieCounter.summarizeMeals();
        calorieCounter.graph();
        calorieCounter.updateJSON();
      } else {
        removeMealErrorMessage.innerHTML = 'That meal wasn\'t added';
        removeMealErrorMessage.classList.add('active');
        setTimeout(function() {
          removeMealErrorMessage.classList.remove('active');
        }, 1500);
      }

    }
  });

  removeMealButton.addEventListener('transitionend', function() {
    if(!removeMealErrorMessage.classList.contains('active')) {
      removeMealErrorMessage.innerHTML = '';
    }
  });

  addItemButton.addEventListener('click', function() {
    if(newItem.value === '' || newItemCalories.value === '' || newItemMeal.value === '') {
      addItemErrorMessage.innerHTML = 'Please fill out all fields';
      addItemErrorMessage.classList.add('active');
      setTimeout(function() {
        addItemErrorMessage.classList.remove('active');
      }, 1500);
    } else {
      var item = {
        name: newItem.value.trim(),
        calories: parseInt(newItemCalories.value.trim()),
      };
      calorieCounter.addItem(newItemMeal.value.trim(), item);
      newItem.value = '';
      newItemCalories.value = '';
      newItemMeal.value = '';
      calorieCounter.summarizeItems();
      calorieCounter.summarizeMeals();
      calorieCounter.graph();
      calorieCounter.updateJSON();
    }
  });

  addItemButton.addEventListener('transitionend', function() {
    if(!addItemErrorMessage.classList.contains('active')) {
      addItemErrorMessage.innerHTML = '';
    }
  });

  calorieCounter.getPreviousCalorieCounter();
};
