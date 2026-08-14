import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";

function showError(msg) {
    const log = document.getElementById("debug-log");
    if (log) {
        log.style.display = "block";
        log.innerHTML = "<b>⚠️ Lỗi:</b> " + msg;
    }
    console.error(msg);
}

if (window.location.protocol === "file:") {
    showError("Bạn đang mở file trực tiếp (file://). Hãy dùng <b>Live Server</b> trong VS Code hoặc chạy Web Server cục bộ!");
}

const container = document.getElementById("canvas-container");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1f1f28);

const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.25, 1.95);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xdbe9ff, 0x332244, 0.8));
const dirLight = new THREE.DirectionalLight(0xffe3ff, 1.1);
dirLight.position.set(1, 3, 2);
scene.add(dirLight);

const fill = new THREE.DirectionalLight(0xaaaaff, 0.4);
fill.position.set(-2, 2, 2);
scene.add(fill);

const clock = new THREE.Clock();
let currentVrm = null;

function getBone(vrm, name) {
    if (!vrm.humanoid) return null;
    return vrm.humanoid.getNormalizedBoneNode(name) || vrm.humanoid.getRawBoneNode(name);
}

const loader = new GLTFLoader();
loader.register((parser) => new VRMLoaderPlugin(parser));

loader.load(
    "./character.vrm",
    (gltf) => {
        const vrm = gltf.userData.vrm;
        if (!vrm) {
            showError("File character.vrm không hợp lệ hoặc thiếu dữ liệu VRM.");
            return;
        }

        VRMUtils.rotateVRM0(vrm);
        vrm.scene.rotation.y = 0; 
        vrm.scene.position.set(0, 0.7, -1.25);
        
        scene.add(vrm.scene);
        currentVrm = vrm;

        setupDefaultPose(vrm);
    },
    undefined,
    (err) => {
        showError("Không tìm thấy file <b>character.vrm</b> trong thư mục dự án!");
    }
);

// Đặt tư thế hạ tay cố định
function setupDefaultPose(vrm) {
    const leftUpperArm = getBone(vrm, "leftUpperArm");
    const rightUpperArm = getBone(vrm, "rightUpperArm");
    const leftLowerArm = getBone(vrm, "leftLowerArm");
    const rightLowerArm = getBone(vrm, "rightLowerArm");

    if (leftUpperArm) {
        leftUpperArm.rotation.z = -1.3; 
    }
    if (rightUpperArm) {
        rightUpperArm.rotation.z = 1.3;
    }
    if (leftLowerArm) {
        leftLowerArm.rotation.y = -0.2;
    }
    if (rightLowerArm) {
        rightLowerArm.rotation.y = 0.2;
    }
}

// Mắt liếc theo con trỏ chuột
const mouse = new THREE.Vector2(0, 0);
window.addEventListener("mousemove", (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

// Tự động chớp mắt
let blinkTimer = 0, blinkValue = 0;
function updateBlink(delta) {
    blinkTimer += delta;
    if (blinkTimer > 3 + Math.random() * 2) { blinkValue = 1; blinkTimer = 0; }
    blinkValue = THREE.MathUtils.lerp(blinkValue, 0, delta * 12);
    if (currentVrm?.expressionManager) {
        try { currentVrm.expressionManager.setValue("blink", blinkValue); currentVrm.expressionManager.update(); } catch(e){}
    }
}

// Xoay cổ nhẹ theo hướng chuột
function updateLookAt(delta) {
    if (!currentVrm) return;
    const neck = getBone(currentVrm, "neck");
    const head = getBone(currentVrm, "head");
    if (!neck) return;

    const targetX = mouse.x * 0.35;
    const targetY = mouse.y * 0.18;

    neck.rotation.y = THREE.MathUtils.lerp(neck.rotation.y, targetX, delta * 4);
    neck.rotation.x = THREE.MathUtils.lerp(neck.rotation.x, targetY, delta * 4);

    if (head) {
        head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, targetX * 0.2, delta * 4);
    }
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    if (currentVrm) {
        currentVrm.update(delta);
        updateBlink(delta);
        updateLookAt(delta);
    }
    camera.lookAt(0, 1.15, 0);
    renderer.render(scene, camera);
}
animate();

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Danh sách câu hỏi dành cho Yuki
const yukiQuestions = [
    { label: "👋 Chào Yuki", exp: "happy", text: "Xin chào bạn nha! Mình là Yuki đây. Chúc bạn một ngày thật tuyệt vời nè!", audio: "./chao.mp3" },
    { label: "🌸 Bạn là ai?", exp: "happy", text: "Mình là Yuki, trợ lý ảo 3D xinh xắn và đáng yêu của bạn đó!", audio: "./ten.mp3" },
    { label: "💖 Khen Yuki cute", exp: "happy", text: "Bạn làm Yuki ngại quá đi à! Cảm ơn câu khen của bạn nhiều nha~", audio: "./cute.mp3" },
    { label: "❤️ Cảm ơn bạn", exp: "happy", text: "Dạ, không có gì đâu ạ! Được trò chuyện với bạn là Yuki vui lắm rồi!", audio: "./camon.mp3" },
    { label: "☀️ Hôm nay thế nào?", exp: "happy", text: "Yuki lúc nào cũng tràn đầy năng lượng và vui vẻ khi thấy bạn!", audio: "./default.mp3" },
    { label: "🍜 Bạn ăn gì chưa?", exp: "relaxed", text: "Yuki chỉ ăn năng lượng điện thôi nè! Bạn đã ăn uống đầy đủ chưa?", audio: "./default.mp3" },
    { label: "🎵 Sở thích của bạn", exp: "happy", text: "Yuki thích nhất là được nhún nhảy và trò chuyện cùng bạn đó!", audio: "./default.mp3" },
    { label: "😠 Trêu Yuki xấu", exp: "angry", text: "Hừm, sao bạn lại nói Yuki như vậy chứ! Yuki buồn bạn luôn đó!", audio: "./default.mp3" },
    { label: "✨ Thả tim Yuki", exp: "surprised", text: "Ôi bất ngờ quá! Yuki thả tim lại cho bạn nè!", audio: "./default.mp3" },
    { label: "👋 Tạm biệt", exp: "sad", text: "Tạm biệt bạn nha! Hẹn sớm gặp lại bạn nè!", audio: "./tambiet.mp3" }
];

let currentAudio = null;

function yukiPlayVoice(audioPath, textLength) {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }

    let lipInterval = null;
    if (currentVrm?.expressionManager) {
        const em = currentVrm.expressionManager;
        const vowels = ["aa", "ih", "ou"];
        lipInterval = setInterval(() => {
            vowels.forEach((v) => em.setValue(v, 0));
            const randomVowel = vowels[Math.floor(Math.random() * vowels.length)];
            em.setValue(randomVowel, 0.7 + Math.random() * 0.3);
            em.update();
        }, 120);
    }

    currentAudio = new Audio(audioPath);
    currentAudio.onended = () => {
        if (lipInterval) clearInterval(lipInterval);
        resetMouth();
    };

    currentAudio.play().catch(() => {
        setTimeout(() => {
            if (lipInterval) clearInterval(lipInterval);
            resetMouth();
        }, Math.min(textLength * 150, 4000));
    });
}

function resetMouth() {
    if (currentVrm?.expressionManager) {
        try {
            const em = currentVrm.expressionManager;
            ["aa", "ih", "ou", "ee", "oh"].forEach((v) => em.setValue(v, 0));
            em.update();
        } catch (e) {}
    }
}

function handleSelectQuestion(item) {
    const chat = document.getElementById("chat-box");
    if (!chat) return;

    chat.innerHTML = `<b>Bạn:</b> ${item.label.replace(/^[^\s]+\s/, '')}<br><span style="color:#ffb8ff"><b>Yuki:</b> ${item.text}</span>`;
    chat.scrollTop = chat.scrollHeight;

    if (currentVrm?.expressionManager) {
        try {
            const em = currentVrm.expressionManager;
            ["happy", "sad", "angry", "surprised", "relaxed"].forEach((exp) => em.setValue(exp, 0));
            em.setValue(item.exp, 1);
            em.update();
            setTimeout(() => {
                ["happy", "sad", "angry", "surprised", "relaxed"].forEach((exp) => em.setValue(exp, 0));
                em.update();
            }, 2500);
        } catch (e) {}
    }

    yukiPlayVoice(item.audio, item.text.length);
}

document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("options-container");
    if (!container) return;

    yukiQuestions.forEach((item) => {
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.textContent = item.label;
        btn.onclick = () => handleSelectQuestion(item);
        container.appendChild(btn);
    });
});
