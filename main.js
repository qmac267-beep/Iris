import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";

// =========================
// Scene Setup
// =========================

const container = document.getElementById("canvas-container");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1f1f28);

// =========================
// Camera
// =========================

const camera = new THREE.PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);

camera.position.set(0, 1.25, 1.95);

// =========================
// Renderer
// =========================

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

container.appendChild(renderer.domElement);

// =========================
// Lighting System
// =========================

scene.add(new THREE.HemisphereLight(0xdbe9ff, 0x332244, 0.8));

const dirLight = new THREE.DirectionalLight(0xffe3ff, 1.1);
dirLight.position.set(1, 3, 2);
scene.add(dirLight);

const fill = new THREE.DirectionalLight(0xaaaaff, 0.4);
fill.position.set(-2, 2, 2);
scene.add(fill);

// =========================
// Variables & State
// =========================

const clock = new THREE.Clock();
let currentVrm = null;

// =========================
// VRM Loader
// =========================

const loader = new GLTFLoader();

loader.register((parser) => {
    return new VRMLoaderPlugin(parser);
});

loader.load(
    "./character.vrm",
    (gltf) => {
        const vrm = gltf.userData.vrm;

        if (!vrm) {
            console.error("Không tìm thấy VRM");
            return;
        }

        VRMUtils.rotateVRM0(vrm);

        vrm.scene.rotation.y = Math.PI;
        vrm.scene.position.set(0, 1.25, -1.5);

        scene.add(vrm.scene);
        currentVrm = vrm;

        console.log("Iris Loaded Successfully!");
    },
    (xhr) => {
        if (xhr.total) {
            console.log(Math.floor((xhr.loaded / xhr.total) * 100) + "%");
        }
    },
    (err) => {
        console.error(err);
    }
);

const lookTarget = new THREE.Vector3(0, 1.15, 0);

// =========================
// Mouse Look
// =========================

const mouse = new THREE.Vector2(0, 0);

window.addEventListener("mousemove", (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

// =========================
// Blink & LookAt Systems
// =========================

let blinkTimer = 0;
let blinkValue = 0;

function updateBlink(delta) {
    blinkTimer += delta;

    if (blinkTimer > 3 + Math.random() * 2) {
        blinkValue = 1;
        blinkTimer = 0;
    }

    blinkValue = THREE.MathUtils.lerp(blinkValue, 0, delta * 12);

    if (currentVrm?.expressionManager) {
        try {
            currentVrm.expressionManager.setValue("blink", blinkValue);
            currentVrm.expressionManager.update();
        } catch (e) {}
    }
}

function updateLookAt(delta) {
    if (!currentVrm) return;

    const neck = currentVrm.humanoid?.getNormalizedBoneNode("neck");
    const head = currentVrm.humanoid?.getNormalizedBoneNode("head");

    if (!neck) return;

    const targetX = mouse.x * 0.35;
    const targetY = mouse.y * 0.18;

    neck.rotation.y = THREE.MathUtils.lerp(neck.rotation.y, targetX, delta * 4);
    neck.rotation.x = THREE.MathUtils.lerp(neck.rotation.x, targetY, delta * 4);

    if (head) {
        head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, targetX * 0.2, delta * 4);
    }
}

// =========================
// Idle Animation: Nhún nhảy nhẹ nhàng + Khép sát 2 tay
// =========================

function updateIdle(time, delta) {
    if (!currentVrm) return;

    const body = currentVrm.humanoid?.getNormalizedBoneNode("hips");
    const spine = currentVrm.humanoid?.getNormalizedBoneNode("spine");
    const head = currentVrm.humanoid?.getNormalizedBoneNode("head");

    if (body) {
        body.position.y = Math.sin(time * 3.5) * 0.025;
        body.rotation.z = Math.sin(time * 1.8) * 0.015;
    }

    if (spine) {
        spine.rotation.x = Math.sin(time * 3.5) * 0.02;
    }

    if (head) {
        head.rotation.z = Math.sin(time * 2.5) * 0.02;
    }

    const leftUpperArm = currentVrm.humanoid?.getRawBoneNode("leftUpperArm");
    const rightUpperArm = currentVrm.humanoid?.getRawBoneNode("rightUpperArm");
    const leftLowerArm = currentVrm.humanoid?.getRawBoneNode("leftLowerArm");
    const rightLowerArm = currentVrm.humanoid?.getRawBoneNode("rightLowerArm");

    if (leftUpperArm) {
        leftUpperArm.rotation.x = 0.05;
        leftUpperArm.rotation.y = 0;
        leftUpperArm.rotation.z = 1.35 + Math.sin(time * 3.5) * 0.02;
    }
    if (rightUpperArm) {
        rightUpperArm.rotation.x = 0.05;
        rightUpperArm.rotation.y = 0;
        rightUpperArm.rotation.z = -1.35 - Math.sin(time * 3.5) * 0.02;
    }

    if (leftLowerArm) {
        leftLowerArm.rotation.x = 0.1;
        leftLowerArm.rotation.z = 0;
    }
    if (rightLowerArm) {
        rightLowerArm.rotation.x = 0.1;
        rightLowerArm.rotation.z = 0;
    }
}

// =========================
// Main Loop
// =========================

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const time = clock.elapsedTime;

    if (currentVrm) {
        currentVrm.update(delta);

        updateIdle(time, delta);
        updateBlink(delta);
        updateLookAt(delta);
    }

    camera.lookAt(lookTarget);
    renderer.render(scene, camera);
}

animate();

// =========================
// Resize Event
// =========================

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// =========================================================
// IRIS DANH SÁCH CÂU HỎI & CÂU TRẢ LỜI LỰA CHỌN
// =========================================================

const irisQuestions = [
    {
        label: "👋 Chào Iris",
        expression: "happy",
        viText: "Xin chào bạn nha! Mình là Iris đây. Chúc bạn một ngày thật tuyệt vời nè!",
        audio: "./chao.mp3"
    },
    {
        label: "🌸 Bạn là ai?",
        expression: "happy",
        viText: "Mình là Iris, trợ lý ảo 3D xinh xắn và đáng yêu của bạn đó!",
        audio: "./ten.mp3"
    },
    {
        label: "💖 Khen Iris cute",
        expression: "happy",
        viText: "Bạn làm Iris ngại quá đi à! Cảm ơn câu khen của bạn nhiều nha~",
        audio: "./cute.mp3"
    },
    {
        label: "❤️ Cảm ơn bạn",
        expression: "happy",
        viText: "Dạ, không có gì đâu ạ! Được trò chuyện với bạn là Iris vui lắm rồi!",
        audio: "./camon.mp3"
    },
    {
        label: "☀️ Hôm nay thế nào?",
        expression: "happy",
        viText: "Iris lúc nào cũng tràn đầy năng lượng và vui vẻ khi thấy bạn! Còn bạn hôm nay thế nào?",
        audio: "./default.mp3"
    },
    {
        label: "🍜 Bạn ăn gì chưa?",
        expression: "relaxed",
        viText: "Iris là trợ lý ảo nên chỉ ăn năng lượng điện thôi nè! Bạn đã ăn uống đầy đủ chưa đó?",
        audio: "./default.mp3"
    },
    {
        label: "🎵 Sở thích của bạn",
        expression: "happy",
        viText: "Iris thích nhất là được nhún nhảy và trò chuyện cùng bạn mỗi ngày đó!",
        audio: "./default.mp3"
    },
    {
        label: "😠 Trêu Iris xấu",
        expression: "angry",
        viText: "Hừm, sao bạn lại nói Iris như vậy chứ! Iris buồn bạn luôn đó nha!",
        audio: "./default.mp3"
    },
    {
        label: "✨ Thả tim Iris",
        expression: "surprised",
        viText: "Ôi bất ngờ quá! Iris thả tim lại cho bạn nè!",
        audio: "./default.mp3"
    },
    {
        label: "👋 Tạm biệt",
        expression: "sad",
        viText: "Tạm biệt bạn nha! Hẹn sớm gặp lại bạn nè, nhớ quay lại chơi với Iris nhé!",
        audio: "./tambiet.mp3"
    }
];

function setExpression(name) {
    if (!currentVrm?.expressionManager) return;

    const em = currentVrm.expressionManager;
    const list = ["happy", "sad", "angry", "surprised", "relaxed"];

    list.forEach((exp) => {
        try { em.setValue(exp, 0); } catch (e) {}
    });

    try {
        em.setValue(name, 1);
        em.update();
    } catch (e) {}

    setTimeout(() => {
        list.forEach((exp) => {
            try { em.setValue(exp, 0); } catch (e) {}
        });
        try { em.update(); } catch (e) {}
    }, 2500);
}

// ===========================================
// Audio Player & Lip-Sync Engine
// ===========================================

let currentAudio = null;

function irisPlayVoice(audioPath, textLength) {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }

    let lipInterval = null;

    // Cử động nhép miệng
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

    // Phát nhạc
    currentAudio = new Audio(audioPath);
    
    currentAudio.onended = () => {
        if (lipInterval) clearInterval(lipInterval);
        resetMouth();
    };

    currentAudio.play().catch((err) => {
        // Tự dừng nhép miệng nếu không tìm thấy file audio mp3
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

// ========================================
// Xử lý khi chọn câu hỏi
// ========================================

function handleSelectQuestion(item) {
    const chat = document.getElementById("chat-box");
    if (!chat) return;

    chat.innerHTML = `<b>Bạn:</b> ${item.label.replace(/^[^\s]+\s/, '')}<br><span style="color:#ffb8ff"><b>Iris:</b> ${item.viText}</span>`;
    chat.scrollTop = chat.scrollHeight;

    setExpression(item.expression);
    irisPlayVoice(item.audio, item.viText.length);
}

// Khởi tạo các nút bấm chọn câu hỏi ra giao diện
document.addEventListener("DOMContentLoaded", () => {
    const optionsContainer = document.getElementById("options-container");
    if (!optionsContainer) return;

    irisQuestions.forEach((item) => {
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.textContent = item.label;
        btn.addEventListener("click", () => handleSelectQuestion(item));
        optionsContainer.appendChild(btn);
    });
});
