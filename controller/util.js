/**
 * General utils
 * @return {}
 */
module.exports = function(){

  /**
   * Occurrences of a substring in another string
   * @param  {string} string    The 'bigger' string
   * @param  {string} substring The string to be searched
   * @return {The number off occurrences}
   */
  this.occurrences = function(string, substring){
    var n=0;
    var pos=0;
    while(true){
      pos=string.indexOf(substring,pos);
      if(pos!=-1){ n++; pos+=substring.length;}
      else{break;}
    }
    return(n);
  }
}
