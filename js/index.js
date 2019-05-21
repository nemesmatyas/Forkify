import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';

import { elements, renderLoader, clearLoader } from './base';

/** GLOBAL STATE
 * - Search object
 * - Current recipe object
 * - Shopping list object
 * - Liked recipes
 */
const state = {};

/** SEARCH CONTROLLER **/
const controlSearch = async () => {
  // 1) Get a query from view
  const query = searchView.getInput();

  if(query){
    // 2) New search object and add it to state
    state.search = new Search(query);

    // 3) Prepare UI for results
    searchView.clearInput();
    searchView.clearResults();
    renderLoader(elements.searchRes);

    try{
      // 4) Search for recipes
      await state.search.getResults();
    }
    catch(error){
      console.log(error + '. Error processing query.');
      clearLoader();
    }
    

    // 5) Render results on UI
    clearLoader();
    if(state.search.result.length !== 0){
      searchView.renderResults(state.search.result);
      console.log(state.search.result);
    }
    else {
      clearLoader();
      alert('The search did not return any search results.');
    }
    
  }
}

elements.searchForm.addEventListener('submit', e => {
  e.preventDefault();
  controlSearch();
});

elements.searchResPages.addEventListener('click', e => {
  const btn = e.target.closest('.btn-inline');
  

  if(btn){
    const goToPage = parseInt(btn.dataset.goto, 10);
    searchView.clearResults();
    searchView.renderResults(state.search.result, goToPage);
    console.log(goToPage);
  }
  console.log(btn);
});

/** RECIPE CONTROLLER **/
const controlRecipe = async () => {
  const id = window.location.hash.replace('#', '');
  console.log(id);

  if(id){
    // Prepare UI for changes
    recipeView.clearRecipe();
    renderLoader(elements.recipe);
    
    // Highlight selected search item
    if(state.search){
      searchView.highlightSelected(id);
    }
    
    // Create new recipe object
    state.recipe = new Recipe(id);

    try {
      // Get recipe data
      await state.recipe.getRecipe();
    }
    catch(error){
      alert('Error processing recipe');
    }
    
    state.recipe.parseIngredients();

    // Calculate servings and cooking time
    state.recipe.calcTime();
    state.recipe.calcServings();

    // Render recipe to UI
    clearLoader();
    recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));
  }
}

/** LIST CONTROLLER */
const controlList = () => {
  // Create a new list, if there is none
  if(!state.list){
    state.list = new List();
  }

  // Add each ingredient to the list and UI
  state.recipe.ingredients.forEach(el => {
    const item = state.list.addItem(el.count, el.unit, el.ingredient);
    listView.renderItem(item);
  });
}

// Handle delete and update list item events
elements.shopping.addEventListener('click', e => {
  const id = e.target.closest('.shopping__item').dataset.itemid;

  // Handle delete button
  if(e.target.matches('.shopping__delete, .shopping__delete *')){
    // Delete from state
    state.list.deleteItem(id);

    // Delete from UI
    listView.deleteItem(id);
  }
  // Handle count update
  else if(e.target.matches('.shopping__count-value')){
    const val = parseFloat(e.target.value);
    state.list.updateCount(id, val);
  }
});

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));



/** LIKES CONTROLLER */
const controlLike = () => {
  
  if(!state.likes){
    state.likes = new Likes();
  }

  const currentID = state.recipe.id;
  

  // Recipe is not liked
  if(!state.likes.isLiked(currentID)){
    // Add like to data (state)
    const newLike = state.likes.addLike(currentID, state.recipe.title, state.recipe.author, state.recipe.img);
    // Toggle like button
    likesView.toggleLikeBtn(true);

    // Add like to UI list
    likesView.renderLike(newLike);
    //console.log(state.likes);
  }
  // Recipe is already liked
  else {
    // Remove like from state
    state.likes.deleteLike(currentID);

    // Toggle like button
    likesView.toggleLikeBtn(false);

    // Remove from UI list
    likesView.deleteLike(currentID);
  }

  likesView.toggleLikeMenu(state.likes.getNumLikes());
}

// Restore liked recipes on page load
window.addEventListener('load', () => {
  state.likes = new Likes();
  // Read data from local storage
  state.likes.readStorage();
  likesView.toggleLikeMenu(state.likes.getNumLikes());
  state.likes.likes.forEach(like => likesView.renderLike(like));
});

// Handling recipe button clicks
elements.recipe.addEventListener('click', e => {
  if(e.target.matches('.btn-decrease, .btn-decrease *')){
    if(state.recipe.servings >= 1){
      state.recipe.updateServings('dec');
      recipeView.updateServingsIngredients(state.recipe);
    }
  }
  else if(e.target.matches('.btn-increase, .btn-increase *')){
    if(state.recipe.servings > 1){
      state.recipe.updateServings('inc');
      recipeView.updateServingsIngredients(state.recipe);
    }
    
  }
  else if(e.target.matches('.recipe__btn--add, .recipe__btn--add *')){
    controlList();
  }
  else if(e.target.matches('.recipe__love, .recipe__love *')){
    controlLike(); 
  }

});