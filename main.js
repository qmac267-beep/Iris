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
        vrm.scene.position.set(0, 0.6, -0.5);

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

// ========================================
// IRIS AI CHAT BRAIN (100% Tiếng Việt)
// ========================================

const irisBrain = [
    {
        keywords: ["hi", "hello", "chao", "xin chao"],
        expression: "happy",
        viText: "Xin chào bạn nha! Mình là Iris đây. Rất vui được gặp bạn nè!",
        audio: "./chao.mp3"
    },
    {
        keywords: ["ten", "la ai", "ai"],
        expression: "happy",
        viText: "Mình là Iris, trợ lý ảo 3D siêu đáng yêu của bạn đó!",
        audio: "./ten.mp3"
    },
    {
        keywords: ["cam on", "thank"],
        expression: "happy",
        viText: "Dạ, không có gì đâu ạ! Cảm ơn bạn nhiều nha!",
        audio: "./camon.mp3"
    },
    {
        keywords: ["dep", "cute", "xinh", "de thuong", "ngai"],
        expression: "happy",
        viText: "Bạn làm Iris ngại quá đi à! Cảm ơn bạn nhiều nha!",
        audio: "./cute.mp3"
    },
    {
        keywords: ["tam biet", "bye", "goodbye"],
        expression: "sad",
        viText: "Tạm biệt bạn nha! Hẹn sớm gặp lại bạn nè!",
        audio: "./tambiet.mp3"
    }
];

const defaultResponse = {
    expression: "relaxed",
    viText: "Dạ? Iris vẫn đang lắng nghe bạn nói nè!",
    audio: "./default.mp3"
};

function removeAccent(str) {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

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

function irisPlayVoice(audioPath) {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }

    currentAudio = new Audio(audioPath);
    let lipInterval = null;

    currentAudio.onplay = () => {
        if (!currentVrm?.expressionManager) return;
        const em = currentVrm.expressionManager;
        const vowels = ["aa", "ih", "ou"];

        lipInterval = setInterval(() => {
            vowels.forEach((v) => em.setValue(v, 0));
            const randomVowel = vowels[Math.floor(Math.random() * vowels.length)];
            em.setValue(randomVowel, 0.7 + Math.random() * 0.3);
            em.update();
        }, 120);
    };

    currentAudio.onended = () => {
        if (lipInterval) clearInterval(lipInterval);

        if (currentVrm?.expressionManager) {
            try {
                const em = currentVrm.expressionManager;
                ["aa", "ih", "ou", "ee", "oh"].forEach((v) => em.setValue(v, 0));
                em.update();
            } catch (e) {}
        }
    };

    currentAudio.play().catch((err) => {
        console.warn("Lỗi phát âm thanh (Kiểm tra xem file .mp3 đã upload chưa):", err);
    });
}

// ========================================
// Chat Logic
// ========================================

function askIris() {
    const input = document.getElementById("user-input");
    const chat = document.getElementById("chat-box");
    const text = input.value.trim();

    if (text === "") return;

    chat.innerHTML += `<br><b>Bạn:</b> ${text}`;
    chat.scrollTop = chat.scrollHeight;
    input.value = "";

    const clean = removeAccent(text);

    setTimeout(() => {
        let matchedItem = null;

        for (const item of irisBrain) {
            for (const key of item.keywords) {
                if (clean.includes(key)) {
                    matchedItem = item;
                    break;
                }
            }
            if (matchedItem) break;
        }

        const vi = matchedItem ? matchedItem.viText : defaultResponse.viText;
        const audioFile = matchedItem ? matchedItem.audio : defaultResponse.audio;
        const exp = matchedItem ? matchedItem.expression : defaultResponse.expression;

        chat.innerHTML += `<br><span style="color:#ffb8ff"><b>Iris:</b> ${vi}</span>`;
        chat.scrollTop = chat.scrollHeight;

        setExpression(exp);
        irisPlayVoice(audioFile);
    }, 300);
}

document.getElementById("send-btn").addEventListener("click", askIris);

document.getElementById("user-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") askIris();
});

// ===========================================
// Voice Recognition (Microphone)
// ===========================================

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = "vi-VN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        document.getElementById("user-input").value = text;
        askIris();
    };
}

const micBtn = document.createElement("button");
micBtn.innerHTML = "🎤";
micBtn.style.position = "absolute";
micBtn.style.right = "20px";
micBtn.style.bottom = "20px";
micBtn.style.width = "60px";
micBtn.style.height = "60px";
micBtn.style.borderRadius = "50%";
micBtn.style.fontSize = "30px";
micBtn.style.cursor = "pointer";

document.body.appendChild(micBtn);

micBtn.onclick = () => {
    if (recognition) {
        recognition.start();
    }
};
