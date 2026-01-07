/**
 * 魔法少女的审判前夜 - 粒子效果
 * 轻柔、悲伤的飘落粒子
 */

class ParticleSystem {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            this.container = document.body;
        }
        
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'particle-canvas';
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
        `;
        this.container.appendChild(this.canvas);
        
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.isRunning = false;
        
        // 粒子配置
        this.config = {
            maxParticles: 60,
            spawnRate: 0.35,  // 每帧生成概率
            // 粒子类型：花瓣、羽毛、光点、魔法星尘、水晶泪滴
            types: ['petal', 'feather', 'glow', 'sparkle', 'crystal']
        };
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    // 创建单个粒子
    createParticle() {
        const type = this.config.types[Math.floor(Math.random() * this.config.types.length)];
        
        const particle = {
            type: type,
            x: Math.random() * this.canvas.width,
            y: -20,
            size: 0,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.02,
            vx: (Math.random() - 0.5) * 0.5,  // 水平漂移
            vy: 0,
            gravity: 0,
            opacity: 0,
            fadeIn: true,
            life: 0,
            maxLife: 0,
            swayPhase: Math.random() * Math.PI * 2,
            swaySpeed: 0.01 + Math.random() * 0.02,
            swayAmount: 0,
            pulsePhase: Math.random() * Math.PI * 2,
            pulseSpeed: 0.05 + Math.random() * 0.03
        };
        
        // 根据类型设置属性
        switch (type) {
            case 'petal':
                particle.size = 8 + Math.random() * 6;
                particle.gravity = 0.008 + Math.random() * 0.005;
                particle.maxLife = 800 + Math.random() * 400;
                particle.swayAmount = 1 + Math.random() * 1.5;
                particle.color = this.getPetalColor();
                break;
                
            case 'feather':
                particle.size = 12 + Math.random() * 8;
                particle.gravity = 0.005 + Math.random() * 0.003;
                particle.maxLife = 1000 + Math.random() * 500;
                particle.swayAmount = 2 + Math.random() * 2;
                particle.rotationSpeed = (Math.random() - 0.5) * 0.01;
                particle.color = 'rgba(255, 255, 255, 0.6)';
                break;
                
            case 'glow':
                particle.size = 3 + Math.random() * 4;
                particle.gravity = 0.003 + Math.random() * 0.002;
                particle.maxLife = 600 + Math.random() * 300;
                particle.swayAmount = 0.5 + Math.random() * 0.5;
                particle.color = this.getGlowColor();
                break;
                
            case 'sparkle':
                particle.size = 4 + Math.random() * 3;
                particle.gravity = 0.002 + Math.random() * 0.002;
                particle.maxLife = 500 + Math.random() * 300;
                particle.swayAmount = 1 + Math.random() * 1;
                particle.color = this.getSparkleColor();
                particle.rotationSpeed = 0.05 + Math.random() * 0.05;
                break;
                
            case 'crystal':
                particle.size = 5 + Math.random() * 4;
                particle.gravity = 0.012 + Math.random() * 0.005;
                particle.maxLife = 700 + Math.random() * 300;
                particle.swayAmount = 0.3 + Math.random() * 0.3;
                particle.color = this.getCrystalColor();
                particle.rotationSpeed = (Math.random() - 0.5) * 0.01;
                break;
        }
        
        return particle;
    }
    
    // 花瓣颜色 - 淡粉、淡紫、白色
    getPetalColor() {
        const colors = [
            'rgba(255, 200, 210, 0.7)',  // 淡粉
            'rgba(230, 180, 220, 0.7)',  // 淡紫粉
            'rgba(255, 220, 230, 0.6)',  // 浅粉
            'rgba(240, 200, 230, 0.6)',  // 淡紫
            'rgba(255, 245, 250, 0.5)',  // 近白
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    // 光点颜色
    getGlowColor() {
        const colors = [
            'rgba(255, 255, 255, 0.8)',
            'rgba(200, 220, 255, 0.7)',
            'rgba(255, 200, 220, 0.6)',
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    // 魔法星尘颜色 - 金色、紫色、蓝色
    getSparkleColor() {
        const colors = [
            'rgba(255, 215, 100, 0.9)',  // 金色
            'rgba(180, 130, 220, 0.8)',  // 紫色
            'rgba(150, 200, 255, 0.8)',  // 蓝色
            'rgba(255, 180, 200, 0.8)',  // 粉色
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    // 水晶泪滴颜色 - 透明蓝、淡紫
    getCrystalColor() {
        const colors = [
            'rgba(180, 220, 255, 0.7)',  // 透明蓝
            'rgba(200, 180, 230, 0.7)',  // 淡紫
            'rgba(220, 220, 255, 0.6)',  // 近白蓝
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    // 更新粒子
    updateParticle(p) {
        p.life++;
        
        // 淡入
        if (p.fadeIn && p.opacity < 1) {
            p.opacity += 0.02;
            if (p.opacity >= 1) {
                p.opacity = 1;
                p.fadeIn = false;
            }
        }
        
        // 淡出
        const fadeOutStart = p.maxLife * 0.7;
        if (p.life > fadeOutStart) {
            p.opacity = 1 - (p.life - fadeOutStart) / (p.maxLife - fadeOutStart);
        }
        
        // 物理更新
        p.vy += p.gravity;
        p.swayPhase += p.swaySpeed;
        p.vx = Math.sin(p.swayPhase) * p.swayAmount * 0.1;
        
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        
        // 脉冲更新（用于魔法星尘）
        if (p.pulsePhase !== undefined) {
            p.pulsePhase += p.pulseSpeed;
        }
        
        // 检查是否超出边界或生命结束
        return p.life < p.maxLife && p.y < this.canvas.height + 50;
    }
    
    // 绘制粒子
    drawParticle(p) {
        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.rotation);
        this.ctx.globalAlpha = p.opacity;
        
        switch (p.type) {
            case 'petal':
                this.drawPetal(p);
                break;
            case 'feather':
                this.drawFeather(p);
                break;
            case 'glow':
                this.drawGlow(p);
                break;
            case 'sparkle':
                this.drawSparkle(p);
                break;
            case 'crystal':
                this.drawCrystal(p);
                break;
        }
        
        this.ctx.restore();
    }
    
    // 绘制花瓣
    drawPetal(p) {
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, p.size * 0.4, p.size, 0, 0, Math.PI * 2);
        this.ctx.fillStyle = p.color;
        this.ctx.fill();
        
        // 花瓣纹理
        this.ctx.beginPath();
        this.ctx.moveTo(0, -p.size * 0.8);
        this.ctx.quadraticCurveTo(p.size * 0.1, 0, 0, p.size * 0.8);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 0.5;
        this.ctx.stroke();
    }
    
    // 绘制羽毛
    drawFeather(p) {
        const w = p.size * 0.3;
        const h = p.size;
        
        // 羽毛主体
        this.ctx.beginPath();
        this.ctx.moveTo(0, -h);
        this.ctx.quadraticCurveTo(w, -h * 0.3, w * 0.8, h * 0.5);
        this.ctx.quadraticCurveTo(0, h * 0.8, -w * 0.8, h * 0.5);
        this.ctx.quadraticCurveTo(-w, -h * 0.3, 0, -h);
        this.ctx.fillStyle = p.color;
        this.ctx.fill();
        
        // 羽毛中轴
        this.ctx.beginPath();
        this.ctx.moveTo(0, -h);
        this.ctx.lineTo(0, h * 0.7);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.lineWidth = 0.5;
        this.ctx.stroke();
    }
    
    // 绘制光点
    drawGlow(p) {
        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
        gradient.addColorStop(0, p.color);
        gradient.addColorStop(0.5, p.color.replace(/[\d.]+\)$/, '0.3)'));
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
    }
    
    // 绘制魔法星尘（四角星）
    drawSparkle(p) {
        // 脉冲效果
        const pulse = 1 + Math.sin(p.pulsePhase) * 0.3;
        const size = p.size * pulse;
        
        // 绘制四角星
        this.ctx.beginPath();
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI / 2);
            const outerX = Math.cos(angle) * size;
            const outerY = Math.sin(angle) * size;
            const innerAngle = angle + Math.PI / 4;
            const innerX = Math.cos(innerAngle) * size * 0.3;
            const innerY = Math.sin(innerAngle) * size * 0.3;
            
            if (i === 0) {
                this.ctx.moveTo(outerX, outerY);
            } else {
                this.ctx.lineTo(outerX, outerY);
            }
            this.ctx.lineTo(innerX, innerY);
        }
        this.ctx.closePath();
        
        // 发光效果
        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, size);
        gradient.addColorStop(0, p.color);
        gradient.addColorStop(1, p.color.replace(/[\d.]+\)$/, '0)'));
        
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        // 中心亮点
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size * 0.2, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fill();
    }
    
    // 绘制水晶泪滴
    drawCrystal(p) {
        const size = p.size;
        
        // 泪滴形状
        this.ctx.beginPath();
        this.ctx.moveTo(0, -size);
        this.ctx.bezierCurveTo(size * 0.6, -size * 0.3, size * 0.5, size * 0.5, 0, size);
        this.ctx.bezierCurveTo(-size * 0.5, size * 0.5, -size * 0.6, -size * 0.3, 0, -size);
        
        // 渐变填充
        const gradient = this.ctx.createLinearGradient(0, -size, 0, size);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        gradient.addColorStop(0.3, p.color);
        gradient.addColorStop(1, p.color.replace(/[\d.]+\)$/, '0.3)'));
        
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        // 高光
        this.ctx.beginPath();
        this.ctx.ellipse(-size * 0.15, -size * 0.4, size * 0.1, size * 0.15, -0.3, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.fill();
    }
    
    // 主循环
    update() {
        if (!this.isRunning) return;
        
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 生成新粒子
        if (this.particles.length < this.config.maxParticles && Math.random() < this.config.spawnRate) {
            this.particles.push(this.createParticle());
        }
        
        // 更新和绘制粒子
        this.particles = this.particles.filter(p => {
            const alive = this.updateParticle(p);
            if (alive) {
                this.drawParticle(p);
            }
            return alive;
        });
        
        requestAnimationFrame(() => this.update());
    }
    
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.update();
    }
    
    stop() {
        this.isRunning = false;
    }
    
    // 设置粒子密度
    setDensity(density) {
        this.config.maxParticles = Math.floor(50 * density);
        this.config.spawnRate = 0.3 * density;
    }
    
    // 清除所有粒子
    clear() {
        this.particles = [];
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // 销毁
    destroy() {
        this.stop();
        this.clear();
        if (this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}

// 全局粒子系统实例
let particleSystem = null;

// 初始化粒子系统（附加到body，覆盖所有界面）
function initParticles() {
    if (particleSystem) {
        particleSystem.destroy();
    }
    // 使用 body 作为容器，这样粒子会覆盖所有界面
    particleSystem = new ParticleSystem(null);
    particleSystem.start();
}

// 停止粒子
function stopParticles() {
    if (particleSystem) {
        particleSystem.stop();
    }
}

// 恢复粒子
function resumeParticles() {
    if (particleSystem) {
        particleSystem.start();
    }
}

// 导出
window.ParticleSystem = ParticleSystem;
window.particleSystem = particleSystem;
window.initParticles = initParticles;
window.stopParticles = stopParticles;
window.resumeParticles = resumeParticles;
