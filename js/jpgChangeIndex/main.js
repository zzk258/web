window.onload = function(){
 var wrap=document.getElementById('wrap');
 var main=document.getElementById('main');
 var p1=document.getElementById('p1');
 
  var img1=document.getElementById('img1');

var divr=document.getElementById('right');
var ospan=divr.getElementsByTagName('span');

  var picName=['pic1','pic2','pic3'];
   var pic=['https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1558364032522&di=6c71c2cb51e312a14aee4871b1594560&imgtype=0&src=http%3A%2F%2Fimg.25pp.com%2Fppnews%2Fzixun_img%2F62b%2Ff1e%2F1442569604211810.jpg','https://ss3.bdstatic.com/70cFv8Sh_Q1YnxGkpoWK1HF6hhy/it/u=1933990775,1328846356&fm=26&gp=0.jpg','https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1558364084504&di=f1da2bd288ff2d2a470f4647cb4c508d&imgtype=0&src=http%3A%2F%2Fimg5.2345.com%2Fduoteimg%2FzixunImg%2Flocal%2F2016%2F09%2F05%2F14730644436808.jpg'];


for(var i=0;i<ospan.length;i++){
 
     
     ospan[i].index=i;
     var clearclass=0; 
  
    
  ospan[i].onclick = function(){
   
      
    
    
    ospan[clearclass].className="spanr";
    
    this.className='active';
    p1.innerHTML=this.index+1+'/'+ospan.length;
    p2.innerHTML=picName[this.index]
    img1.src=pic[this.index];
   
     clearclass=this.index;
  
    
  }
    
  
}
  
  
  
  
  
  
}