const ctxMostApproved = document.getElementById('myChart');
let chartMostApproved; // giữ biểu đồ hiện tại

function fetchMostApprovedStats(duration, number_time, how_much) {
    fetch('/test/most-approved-journalist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration, number_time, how_much })
    })
    .then(res => res.json())
    .then(result => {
        const data = result.data;
        const labels = data.map(j => j.username);
        const values = data.map(j => j.approved_articles_count);
        renderMostApprovedChart(labels, values);
    })
    .catch(err => console.error("Lỗi khi lấy dữ liệu nhà báo:", err));
}

function renderMostApprovedChart(labels, values) {
    if (chartMostApproved) chartMostApproved.destroy(); // Xóa biểu đồ cũ nếu có

    chartMostApproved = new Chart(ctxMostApproved, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Số bài viết đã duyệt',
                data: values,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(255, 159, 64, 0.2)',
                    'rgba(255, 205, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(201, 203, 207, 0.2)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(255, 205, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(201, 203, 207, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Số bài viết' }
                },
                x: {
                    title: { display: true, text: 'Tên nhà báo' }
                }
            }
        }
    });
}

// Sự kiện click nút
const fetchMostApprovedBtn = document.getElementById('fetchStatsBtn');
if (fetchMostApprovedBtn) {
    fetchMostApprovedBtn.addEventListener('click', () => {
        const duration = document.getElementById('durationSelect').value;
        const number_time = parseInt(document.getElementById('numberTime').value);
        const how_much = parseInt(document.getElementById('howMuch').value);

        if (isNaN(number_time) || isNaN(how_much) || number_time <= 0 || how_much <= 0) {
            alert("Vui lòng nhập số hợp lệ");
            return;
        }

        fetchMostApprovedStats(duration, number_time, how_much);
    });

    // Tự động fetch mặc định ban đầu
    fetchMostApprovedStats('month', 1, 5);
}
