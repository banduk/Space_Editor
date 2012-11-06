
module.exports = function(){
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
