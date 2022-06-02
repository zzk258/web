window.onload = function(){


var menu = document.getElementById('menu');
var lis = menu.getElementsByTagName('li');
var dls = menu.getElementsByTagName('dl');

var imain = document.getElementById('imain');
var ifm = imain.getElementsByTagName('iframe')[0];

var arr=[['html/alshow/index.html','html/hm/index.html','html/studyhtml/index.html','html/xh/index.html','html/jd/index.html'],['js/contentFind/index.html','js/contentMove/index.html','js/createDiv/index.html','js/draw/index.html','js/jpgChange/index.html','js/jpgChangeIndex/index.html','js/startMove/index.html','js/swiper/index.html'],['jquery/animation/index.html','jquery/event/index.html','jquery/nav/index.html','jquery/shopCart/index.html']]

for (var i = 0; i < lis.length; i++) {

    lis[i].index = i;

    lis[i].onclick = function () {

        for (var i = 0; i < lis.length; i++) {
            lis[i].className = '';
            dls[i].style.display = 'none';
        }

        this.className = 'active';
        dls[this.index].style.display = 'block';
        var x=this.index;

        var dds = dls[this.index].getElementsByTagName('dd');

        for (var i = 0; i < dds.length; i++) {
            dds[i].index = i;
            dds[i].onclick = function () {
                //alert(arr[x][this.index]);
                ifm.src=arr[x][this.index];
            }
        }

    }

}


lis[0].onclick();
  
  
}