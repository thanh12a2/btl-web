document.addEventListener('DOMContentLoaded', function() {
    const scrollableContentTs = document.querySelector('.scrollableContentThoisu');
    const scrollbarButtonTs = document.querySelector('.scrollbarButtonThoisu');
    const customScrollbarTs = document.querySelector('.customScrollbarThoisu');
    const newsItemsTs = document.querySelectorAll('.newsItemThoisu'); // newsItemsTs
    const mainImageTs = document.querySelector('.mainImageThoisu');
    const articleTitleTs = document.querySelector('.articleTitleThoisu');
    const articleParagraphTs = document.querySelector('.articleParagraphThoisu');
    const containerThoisu = document.querySelector('.containerThoisu');
     const leftColumnThoisu = document.querySelector('.leftColumnThoisu');
    const rightColumnThoisu = document.querySelector('.rightColumnThoisu');


    if (!scrollableContentTs || !scrollbarButtonTs || !customScrollbarTs || !mainImageTs || !articleTitleTs || !articleParagraphTs || !containerThoisu) {
        console.error("Scrollbar or content elements not found");
        return;
    }

    let isDraggingTs = false;
    let startYTs = 0;
    let currentYTs = 0;
    let contentScrollTopTs = 0; // sync scroll

    scrollbarButtonTs.addEventListener('mousedown', function(e) {
        isDraggingTs = true;
        startYTs = e.clientY - scrollbarButtonTs.offsetTop;
        document.body.classList.add('no-select'); // ko select text khi grab
    });

    document.addEventListener('mousemove', function(e) {
        if (!isDraggingTs) return;

        const scrollbarTrackHeightTs = customScrollbarTs.offsetHeight;
        const scrollButtonHeightTs = scrollbarButtonTs.offsetHeight;
        const maxScrollTopButtonTs = scrollbarTrackHeightTs - scrollButtonHeightTs;

        currentYTs = e.clientY - startYTs;
        if (currentYTs < 0) {
            currentYTs = 0;
        }
        if (currentYTs > maxScrollTopButtonTs) {
            currentYTs = maxScrollTopButtonTs;
        }

        scrollbarButtonTs.style.top = currentYTs + 'px';

        // tinh toan % scroll
        const scrollPercentageTs = currentYTs / maxScrollTopButtonTs;
        contentScrollTopTs = scrollPercentageTs * (scrollableContentTs.scrollHeight - scrollableContentTs.offsetHeight);
        scrollableContentTs.scrollTop = contentScrollTopTs;
    });

    document.addEventListener('mouseup', function() {
        isDraggingTs = false;
        document.body.classList.remove('no-select');
    });

    // ko select text khi drag
    document.body.addEventListener('selectstart', function(e){
        if (document.body.classList.contains('no-select')) {
            e.preventDefault();
        }
    });

    // hover effect
    newsItemsTs.forEach(item => { // newsItemsTs
        item.addEventListener('mouseenter', function() {
            const mainImageTs = document.querySelector('.mainImageThoisu');
            const articleTitleTs = document.querySelector('.articleTitleThoisu');
            const articleParagraphTs = document.querySelector('.articleParagraphThoisu');
            // const newsImageTs = item.querySelector('.newsImageThoisu'); // newsImageTs
            const newsTitleTs = item.querySelector('.newsTitleThoisu'); // newsTitleTs
            const newsParagraphTs = item.querySelector('.newsParagraphThoisu'); // newsParagraphTs
             const mainUrls = document.querySelectorAll('.mainUrl');
            // (existing code to update main image and article)
            mainImageTs.src = item.dataset.img;
            articleTitleTs.textContent = item.dataset.title;
            articleParagraphTs.textContent = item.dataset.paragraph;
            mainUrls.forEach(mainUrl => {
                mainUrl.href = "/article/transportArticle/" + (item.dataset.name || "#");
            });

            // dynamic text color based on canvas (cho newsTitleTs)
            // const imgForTitleTs = new Image(); // Separate Image object for title color analysis
            // imgForTitleTs.src = newsImageTs.src; // newsImageTs

            // imgForTitleTs.onload = function() {
            //     const canvasTs = document.createElement('canvas');
            //     canvasTs.width = imgForTitleTs.width;
            //     canvasTs.height = imgForTitleTs.height;
            //     const ctxTs = canvasTs.getContext('2d');
            //     ctxTs.drawImage(imgForTitleTs, 0, 0);

            //     const imageDataTs = ctxTs.getImageData(0, 0, imgForTitleTs.width, imgForTitleTs.height).data;
            //     let totalLuminanceTs = 0;
            //     for (let i = 0; i < imageDataTs.length; i += 4) {
            //         const r = imageDataTs[i];
            //         const g = imageDataTs[i + 1];
            //         const b = imageDataTs[i + 2];
            //         const luminanceTs = (0.299 * r + 0.587 * g + 0.114 * b);
            //         totalLuminanceTs += luminanceTs;
            //     }
            //     const averageLuminanceTs = totalLuminanceTs / (imgForTitleTs.width * imgForTitleTs.height);

            //     if (averageLuminanceTs < 128) {
            //         newsTitleTs.style.color = 'white'; // newsTitleTs
            //     } else {
            //         newsTitleTs.style.color = 'black'; // newsTitleTs
            //     }
            // };

            // --- dynamic text color based on canvas (cho newsImageTs)
            // const imgForParagraphTs = new Image(); // Separate Image object for paragraph color analysis
            // imgForParagraphTs.src = newsImageTs.src; // newsImageTs

            // imgForParagraphTs.onload = function() {
            //     const canvasParaTs = document.createElement('canvas'); // Separate canvas for paragraph
            //     canvasParaTs.width = imgForParagraphTs.width;
            //     canvasParaTs.height = imgForParagraphTs.height;
            //     const ctxParaTs = canvasParaTs.getContext('2d'); // Separate context for paragraph canvas
            //     ctxParaTs.drawImage(imgForParagraphTs, 0, 0);

            //     const imageDataParaTs = ctxParaTs.getImageData(0, 0, imgForParagraphTs.width, imgForParagraphTs.height).data;
            //     let totalLuminanceParaTs = 0;
            //     for (let i = 0; i < imageDataParaTs.length; i += 4) {
            //         const r = imageDataParaTs[i];
            //         const g = imageDataParaTs[i + 1];
            //         const b = imageDataParaTs[i + 2];
            //         const luminanceParaTs = (0.299 * r + 0.587 * g + 0.114 * b);
            //         totalLuminanceParaTs += luminanceParaTs;
            //     }
            //     const averageLuminanceParaTs = totalLuminanceParaTs / (imgForParagraphTs.width * imgForParagraphTs.height);

            //     if (averageLuminanceParaTs < 128) {
            //         newsParagraphTs.style.color = 'white'; // newsParagraphTs
            //     } else {
            //         newsParagraphTs.style.color = 'black'; // Original paragraph color
            //     }
            // };


        });
    });

    let mouseleaveTimeoutIDTs; // Var store timeout ID cho mouseleave debounce

    newsItemsTs.forEach(item => { // newsItemsTs
        item.addEventListener('mouseleave', function() {
            const newsTitleTs = item.querySelector('.newsTitleThoisu'); // newsTitleTs
            const newsParagraphTs = item.querySelector('.newsParagraphThoisu'); // newsParagraphTs

            mouseleaveTimeoutIDTs = setTimeout(() => {
                newsTitleTs.style.color = ''; // reset // newsTitleTs
                newsParagraphTs.style.color = ''; // reset // newsParagraphTs
                mouseleaveTimeoutIDTs = null; // clear timeout ID khi xong
            }, 100);
        });
    });


     // Scroll
     rightColumnThoisu.addEventListener('wheel', function(e) {
        e.preventDefault(); // ngăn default scroll

        const scrollSensitivityTs = 80; // scroll speed
        const scrollAmountTs = e.deltaY * (scrollSensitivityTs/100); // số lượng scroll
        const scrollbarTrackHeightTs = customScrollbarTs.offsetHeight;
        const scrollButtonHeightTs = scrollbarButtonTs.offsetHeight;
        const maxScrollTopButtonTs = scrollbarTrackHeightTs - scrollButtonHeightTs;
        const contentScrollHeightTs = scrollableContentTs.scrollHeight - scrollableContentTs.offsetHeight;

        // tính scrollTop mới cho content
        contentScrollTopTs += scrollAmountTs; // update tracked contentScrollTop
        if (contentScrollTopTs < 0) {
            contentScrollTopTs = 0;
        }
        if (contentScrollTopTs > contentScrollHeightTs) {
            contentScrollTopTs = contentScrollHeightTs;
        }
        scrollableContentTs.scrollTop = contentScrollTopTs; // áp dụng scroll cho content

        // tính % scroll cho content (not button)
        const scrollPercentageTs = contentScrollHeightTs === 0 ? 0 : contentScrollTopTs / contentScrollHeightTs;

        // tính vị trí top mới cho scroll button
        let newScrollButtonTopTs = scrollPercentageTs * maxScrollTopButtonTs;
        if (newScrollButtonTopTs < 0) {
            newScrollButtonTopTs = 0;
        }
        if (newScrollButtonTopTs > maxScrollTopButtonTs) {
            newScrollButtonTopTs = maxScrollTopButtonTs;
        }

        scrollbarButtonTs.style.top = newScrollButtonTopTs + 'px'; // di chuyển button
    });


    // setup vi tri scrollbar button on load neu co content de scroll
    if (scrollableContentTs.scrollHeight > scrollableContentTs.offsetHeight) {
        scrollbarButtonTs.style.top = '0px'; // reset to top on load if scrollable
    } else {
        customScrollbarTs.style.display = 'none'; // hide custom scrollbar neu ko can
    }
});
// fill newsParagraphThoisu tu data-paragraph on load
const newsItemsParagraphsTs = document.querySelectorAll('.newsItemThoisu'); // newsItemsParagraphsTs
newsItemsParagraphsTs.forEach(newsItem => { // newsItemsParagraphsTs
    const paragraphContentTs = newsItem.dataset.paragraph;
    const paragraphElementTs = newsItem.querySelector('.newsParagraphThoisu');
    if (paragraphElementTs && paragraphContentTs) {
        paragraphElementTs.textContent = paragraphContentTs;
        // shorten paragraph
        if (paragraphContentTs.length > 100) {
            paragraphElementTs.textContent = paragraphContentTs.substring(0, 140) + "..."; //shorten to 140
        }
    }
});