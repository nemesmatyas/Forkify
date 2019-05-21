import axios from 'axios';
import { apiKey, proxy } from '../config';

export default class Search {
  constructor(query){
    this.query = query;
  }

  async getResults(){
    
    try {
      const response = await axios(`${proxy}https://www.food2fork.com/api/search?key=${apiKey}&q=${this.query}`);
      console.log(response);
      this.result = response.data.recipes;
    }
    catch(error){
      alert(error);
    }

    
  }
}