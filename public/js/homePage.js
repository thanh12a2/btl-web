// Lấy tất cả các carousel-item
const carouselItems = document.querySelectorAll('.carousel-item');

// Dùng sự kiện khi carousel bắt đầu chuyển động
document.querySelector('#carouselExampleAutoplaying').addEventListener('slide.bs.carousel', function (event) {
    // Lấy element của carousel-item hiện tại
    const currentItem = event.relatedTarget;
    
    // Lấy các phần tử chứa tiêu đề trong item hiện tại
    const title = currentItem.querySelector('.big-news-title');
    
    // Thêm lớp 'hidden-title' vào tiêu đề, khiến nó biến mất
    title.classList.add('hidden-title');
    
    // Xóa lớp 'fade-title' nếu có (đảm bảo không bị xung đột)
    title.classList.remove('fade-title');
});

// Khi carousel đã hoàn tất chuyển động, khôi phục lại tiêu đề với hiệu ứng fade
document.querySelector('#carouselExampleAutoplaying').addEventListener('slid.bs.carousel', function (event) {
    const currentItem = event.relatedTarget;
    const title = currentItem.querySelector('.big-news-title');
    
    // Đảm bảo tiêu đề có thời gian fade in ổn định
    setTimeout(() => {
        // Xóa lớp 'hidden-title' để tiêu đề xuất hiện trở lại
        title.classList.remove('hidden-title');
        
        // Thêm lại lớp 'fade-title' để áp dụng hiệu ứng fade
        title.classList.add('fade-title');
    }, 100); // Đặt độ trễ nhỏ để đảm bảo lớp fade-title được thêm đúng thời điểm
});
