
window.onload=function(){



var div1=new Vue({
    el:'#div1',
    data:{
        mdata:'',
        mlist:[],
        murl:'',
        mpic:'',
        comment:[],
    },

    methods:{
        sh:function(){
            var that=this;
            axios.get('https://autumnfish.cn/search?keywords='+this.mdata)
            .then(function(response){
                that.mlist=response.data.result.songs;
                //console.log(response.data.result.songs)
                
            },function(err){
                alert(err)
            });
            
        },

        mplay:function(mid){
            var that=this;
            //获取地址
            axios.get('https://autumnfish.cn/song/url?id='+mid).then(function(response){
                that.murl=response.data.data[0].url;
               // alert(response.data.data[0].url);
            },function(err){
                alert(err);
            });
            //播放图片
            axios.get('https://autumnfish.cn/song/detail?ids='+mid).then(function(response){
                that.mpic=response.data.songs[0].al.picUrl;
               //alert(response.data.songs[0].al.picUrl);
            },function(err){
                alert(err);
            })

            axios.get('https://autumnfish.cn/comment/hot?type=0&id='+mid).then(function(response){
                //alert(response.data.hotComments);
                that.comment=response.data.hotComments;
            },function(err){
                alert(err);
            })
        }
    }
});

}