window.onload = function() {

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
            calorieCounter.summarizeCalories();
            calorieCounter.graph();
          }
        }
      }
      xhttp.open("GET", "http://127.0.0.1:8000/calorie_counter?id=" + this.guid, true);
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
      var url = "http://127.0.0.1:8000/setGuid";

      var oldInfo = {
        meals: this.meals,
        calories: this.calories,
        guid: this.guid,
      };

      var params = "id=" + this.guid + "&calorieCounter=" + JSON.stringify(oldInfo);

      xhttp.open("POST", url, true);

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
        return true;
      }
      this.sumCalories();
    },


    addItem: function(meal, item) {
      if(!this.meals[meal]) {
        this.meals[meal] = new this.Meal();
      }
      this.meals[meal].items[item.name] = item.calories;
      this.meals[meal].calories += item.calories;
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
        return true;
      }
      this.sumCalories();
    },


    summarizeCalories: function() {
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

    summarizeItems: function() {
      var html = '<thead><tr><th>Meal</th><th>Item</th><th>Calories</th></tr></thead><tbody>';


      for(meal in this.meals) {
        for(item in this.meals[meal].items) {
          html += `<tr>
                     <td>${meal}</td>
                     <td>${item}</td>
                     <td>${this.meals[meal].items[item]}</td>
                   </tr>`;
        }
      }
      html += '</tbody>'
      itemTable.innerHTML = html;
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
        this.chart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: names,
            datasets: [{
              label: 'Calories Per Item',
              backgroundColor: 'limegreen',
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

  var addMealButton = document.getElementById("addMealButton");
  var addMealInput = document.getElementById("addMealInput");

  var removeMealButton = document.getElementById("removeMealButton");
  var removeMealInput = document.getElementById("removeMealInput");

  var addItemButton = document.getElementById("addItemButton");
  var newItemMeal = document.getElementById("newItemMeal");
  var newItem = document.getElementById("newItem");
  var newItemCalories = document.getElementById("newItemCalories");

  var removeItemButton = document.getElementById("removeItemButton");
  var itemToRemoveMeal = document.getElementById("itemToRemoveMeal");
  var itemToRemove = document.getElementById("itemToRemove");

  var itemTable = document.getElementById("itemTable");
  var calorieTable = document.getElementById("calorieTable");

  addMealButton.addEventListener('click', function() {
    if(addMealInput.value === '') {
      return;
    } else {
      calorieCounter.addMeal(addMealInput.value);
      calorieCounter.summarizeCalories();
      calorieCounter.summarizeItems();
      calorieCounter.updateJSON();
      addMealInput.value = '';
    }
  });

  removeMealButton.addEventListener('click', function() {
    if(removeMealInput.value === '') {
      console.log('Please fill out all fields');
    } else {
      if(calorieCounter.removeMeal(removeMealInput.value)) {
        removeMealInput.value = '';
        calorieCounter.summarizeCalories();
        calorieCounter.summarizeItems();
        calorieCounter.graph();
        calorieCounter.updateJSON();
      } else {
        console.log('This meal wasn\'t added');
      }

    }
  });

  addItemButton.addEventListener('click', function() {
    if(newItem.value === '' || newItemCalories.value === '' || newItemMeal.value === '') {
      console.log('Please fill out all fields');
    } else {
      var item = {
        name: newItem.value,
        calories: parseInt(newItemCalories.value),
      };
      calorieCounter.addItem(newItemMeal.value, item);
      newItem.value = '';
      newItemCalories.value = '';
      newItemMeal.value = '';
      calorieCounter.summarizeCalories();
      calorieCounter.summarizeItems();
      calorieCounter.graph();
      calorieCounter.updateJSON();
    }
  });

  removeItemButton.addEventListener('click', function() {
    if(itemToRemoveMeal.value === '' || itemToRemove.value === '') {
      console.log('Please fill out all fields');
    } else {
      if(calorieCounter.removeItem(itemToRemoveMeal.value, itemToRemove.value)) {
        itemToRemoveMeal.value = '';
        itemToRemove.value = '';
        calorieCounter.summarizeCalories();
        calorieCounter.summarizeItems();
        calorieCounter.graph();
        calorieCounter.updateJSON();
      } else {
        console.log('This item wasn\'t added');
      }
    }
  });
  calorieCounter.getPreviousCalorieCounter();
};
