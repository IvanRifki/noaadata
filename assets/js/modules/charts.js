/**
 * CHARTS MODULE
 * Logic for Chart.js rendering and updates.
 */

export class ChartsModule {
    constructor() {
        this.instances = {
            magPie: null,
            depthBar: null
        };
        
        Chart.defaults.font.family = 'Inter';
        Chart.defaults.color = '#475569';
    }

    init() {
        this.initMagPie();
        this.initDepthBar();
    }

    initMagPie() {
        const ctx = document.getElementById('magPieChart');
        if (!ctx) return;

        this.instances.magPie = new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['M >= 6.0', 'M 5.0 - 5.9', 'M < 5.0'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: ['#dc2626', '#f59e0b', '#10b981'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { boxWidth: 10, font: { size: 10 } }
                    }
                }
            }
        });
    }

    initDepthBar() {
        const ctx = document.getElementById('depthChart');
        if (!ctx) return;

        this.instances.depthBar = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Kedalaman (Km)',
                    data: [],
                    backgroundColor: '#3b82f6',
                    borderRadius: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { display: false },
                    y: { ticks: { font: { size: 9 }, stepSize: 50 } }
                }
            }
        });
    }

    update(catData, depthData) {
        if (this.instances.magPie) {
            this.instances.magPie.data.datasets[0].data = catData;
            this.instances.magPie.update();
        }
        if (this.instances.depthBar) {
            this.instances.depthBar.data.labels = depthData.labels;
            this.instances.depthBar.data.datasets[0].data = depthData.values;
            this.instances.depthBar.update();
        }
    }
}
