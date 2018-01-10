$(document).ready(function() {
    // 图片链接有问题 随机字段img7 img3
    getMoviesData()
        .then(function(data){
            if(typeof data === 'string'){
                data = JSON.parse(data)
            } 
            console.log('电影数量', data.count)
            let $li =  $('#movie-items > li').clone();
            $('#movie-items').empty()
            let $ul = $('#movie-items')
            for(let i = 0; i < data.count; i++){
                let $newLi = $li.clone()
                // img
                let imgUrl7 = data.subjects[i].img
                let imgUrl3 = data.subjects[i].img.replace(/7/, 3)
                console.log(imgUrl7)
                // $newLi.children('a').children('img').attr('src', data.subjects[i].img)
                $newLi.children('a').children('img').attr('src', imgUrl3)
                
                $('.movie-img').one('error', function(e){
                    console.log('img error')
                    $(this).attr('src', '/images/1.jpg');
                })
                
                let $spans = $('.movie-info', $newLi).children()
                // name                
                $spans.children('.name').text(data.subjects[i].movieName)
                // url
                $spans.children('.name').attr('href', 'https://movie.douban.com/subject/' + data.subjects[i].movieId)
                // rating
                $spans[1].innerText = '电影评分：' + data.subjects[i].rating
                // genres
                $spans[2].innerText = '电影类型：' + data.subjects[i].genres
                // summary
                $('.movie-summary', $newLi).text(data.subjects[i].summary)
                $ul.append($newLi)
            }
        })
});



function getMoviesData() {
    let url = '/movies'
    // let url = '/javascripts/test.json'

    return $.get(url)
        .promise()
        .then(function (data) {
            console.log('data', data)
            return data
        })
        .catch(function(err){
            if (err) {
                console.log('err', err)
                return
            }
        })
};



