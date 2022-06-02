


window.onload=function(){
  var obox=document.getElementById("box");
  var obtn=obox.getElementsByTagName("input");
  var opic=document.getElementById("pic");
  var op=obox.getElementsByTagName("p")[0];
  var ospan=obox.getElementsByTagName("span")[0];
  
 
  var arr=["https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1581514051083&di=a78a2076ecaa2bd4ab0510ecb95ade1c&imgtype=0&src=http%3A%2F%2Fimg.iplaysoft.com%2Fwp-content%2Fuploads%2F2014%2Fnews%2F2353%2Fsurfacepro3.jpg","https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1581514138340&di=5b0c8055fbc166c75e9d1a21a1d2d6cf&imgtype=0&src=http%3A%2F%2Fwww.zdtconn.com%2Fdata%2Fupload%2Fimage%2F20170415%2F1492238915954569.jpg","https://ss2.bdstatic.com/70cFvnSh_Q1YnxGkpoWK1HF6hhy/it/u=2420231289,1403406641&fm=26&gp=0.jpg"]
  var num=0;
  var onoff=true;
  //alert(num);
  ospan.innerHTML=num+"/"+(arr.length-1);
  opic.src=arr[0];
  obtn[0].onclick=function(){
    onoff=true;
    op.innerHTML="顺序模式";
  }
  
  obtn[1].onclick=function(){
    onoff=false;
    op.innerHTML="循环模式";
  }
  
  obtn[3].onclick=function(){
   
    if(num>=arr.length-1){
      if(onoff){
        num=arr.length-1;
      }else{num=0}
      
    }else{num++};
   opic.src=arr[num];
     ospan.innerHTML=num+"/"+(arr.length-1);
    
    
  
  }
  
  obtn[2].onclick=function(){
    if(num<=0){
      if(onoff){
        num=0
      }else{num=arr.length-1}
      
    }else{
      num--;
    }    
    pic.src=arr[num];
    ospan.innerHTML=num+"/"+(arr.length-1);
  }
  
   
  
  
  
}




 
  


