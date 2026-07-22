import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
    VRMLoaderPlugin,
    VRMUtils
} from "@pixiv/three-vrm";

// =========================
// Scene Setup
// =========================

const container = document.getElementById("canvas-container");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1f1f28); // Tông màu tối huyền ảo

// =========================
// Camera
// =========================

const camera = new THREE.PerspectiveCamera(
    35, // Góc nhìn hẹp hơn để tập trung vào nhân vật
    window.innerWidth / window.innerHeight,
    0.1,
    100
);

// Vị trí camera tối ưu để nhìn rõ tư thế e thẹn 👉👈
camera.position.set(0, 1.25, 1.8);

// =========================
// Renderer
// =========================

const renderer = new WebGLRenderer({
    antialias: true,
    alpha: true
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

container.appendChild(renderer.domElement);

// =========================
// Lighting System (Ánh sáng dịu nhẹ, tone tím hồng)
// =========================

scene.add(new THREE.HemisphereLight(
    0xdbe9ff, // Ánh sáng trời xanh nhẹ
    0x332244, // Ánh sáng dội từ dưới đất tím đậm
    0.8 // Cường độ vừa phải
));

const dirLight = new THREE.DirectionalLight(
    0xffe3ff, // Ánh sáng chính màu hồng nhạt huyền ảo
    1.1 // Cường độ mạnh để tạo khối
);
dirLight.position.set(1, 3, 2); // Hướng sáng từ trên cao, bên phải, phía trước
scene.add(dirLight);

const fill = new THREE.DirectionalLight(
    0xaaaaff, // Ánh sáng phụ màu xanh tím lạnh
    0.4 // Cường độ nhẹ để làm dịu bóng đổ
);
fill.position.set(-2, 2, 2); // Hướng sáng đối xứng với đèn chính
scene.add(fill);

// =========================
// Variables & State Timers
// =========================

const clock = new THREE.Clock();
let currentVrm = null;

// Timer điều khiển phản ứng giật mình (tạm thời không dùng vì tư thế 👉👈 cố định)
let clickReactionTimer = 0;

// =========================
// VRM Loader
// =========================

const loader = new GLTFLoader();

loader.register((parser) => {
    return new VRMLoaderPlugin(parser);
});

loader.load(
    "./character.vrm", // Đảm bảo file .vrm nằm cùng thư mục
    (gltf) => {
        const vrm = gltf.userData.vrm;

        if (!vrm) {
            console.error("Không tìm thấy VRM");
            return;
        }

        VRMUtils.rotateVRM0(vrm); // Xoay nhân vật về hướng chính diện

        vrm.scene.rotation.y = Math.PI; // Điều chỉnh xoay 180 độ
        vrm.scene.position.set(0, 0.6, -0.5); // Điều chỉnh vị trí nhân vật

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

const lookTarget = new THREE.Vector3(0, 1.15, 0); // Điểm nhìn cố định

// =========================
// Mouse Look & Interactive Tracking (Tạm thời không dùng để tập trung vào tư thế 👉👈)
// =========================

const mouse = new THREE.Vector2(0, 0);

window.addEventListener("mousemove", (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

// =========================
// Click Interaction (Chạm vào Iris - Tạm thời không dùng)
// =========================

const raycaster = new THREE.Raycaster();

window.addEventListener("click", (e) => {
    // Tránh ăn sự kiện khi bấm nút chat hoặc microphone
    if (e.target.tagName === "BUTTON" || e.target.tagName === "INPUT") return;

    raycaster.setFromCamera(mouse, camera);

    if (currentVrm) {
        const intersects = raycaster.intersectObjects(currentVrm.scene.children, true);

        if (intersects.length > 0) {
            clickReactionTimer = 0.5; // Kích hoạt phản ứng nảy nhẹ
            setExpression("surprised"); // Đổi biểu cảm ngạc nhiên

            // Phát tiếng chào
            irisSpeak("Bạn chạm vào Iris làm gì thế? Hihi 💜");
        }
    }
});

// =========================
// Animation: Cute Shy Finger Tapping (Cố định tư thế 👉👈)
// =========================

function updateShyPose(time) {
    if (!currentVrm) return;

    const leftUpperArm = currentVrm.humanoid?.getRawBoneNode("leftUpperArm");
    const rightUpperArm = currentVrm.humanoid?.getRawBoneNode("rightUpperArm");
    const leftLowerArm = currentVrm.humanoid?.getRawBoneNode("leftLowerArm");
    const rightLowerArm = currentVrm.humanoid?.getRawBoneNode("rightLowerArm");
    const leftHand = currentVrm.humanoid?.getRawBoneNode("leftHand");
    const rightHand = currentVrm.humanoid?.getRawBoneNode("rightHand");

    // Nhịp gõ nhẹ liên tục giữa 2 ngón trỏ
    const tap = Math.sin(time * 9) * 0.025;

    // Tay trái đưa ra trước ngực
    if (leftUpperArm) {
        leftUpperArm.rotation.x = 0.55;
        leftUpperArm.rotation.y = -0.25;
        leftUpperArm.rotation.z = 0.45 + tap; // Góc nâng và nhịp tap
    }
    if (leftLowerArm) {
        leftLowerArm.rotation.x = 0.1;
        leftLowerArm.rotation.y = 1.25; // Xoay khuỷu tay vào trong
        leftLowerArm.rotation.z = -0.25;
    }
    if (leftHand) {
        leftHand.rotation.x = 0.1;
        leftHand.rotation.y = -0.3; // Xoay cổ tay
        leftHand.rotation.z = 0.2;
    }

    // Tay phải đối xứng
    if (rightUpperArm) {
        rightUpperArm.rotation.x = 0.55;
        rightUpperArm.rotation.y = 0.25;
        rightUpperArm.rotation.z = -0.45 - tap; // Góc nâng và nhịp tap đối xứng
    }
    if (rightLowerArm) {
        rightLowerArm.rotation.x = 0.1;
        rightLowerArm.rotation.y = -1.25; // Xoay khuỷu tay vào trong
        rightLowerArm.rotation.z = 0.25;
    }
    if (rightHand) {
        rightHand.rotation.x = 0.1;
        rightHand.rotation.y = 0.3; // Xoay cổ tay
        rightHand.rotation.z = -0.2;
    }

    // Co các ngón tay khác lại (Thumb, Middle, Ring, Little) tạo dáng nắm nhẹ
    const otherFingers = ["Thumb", "Middle", "Ring", "Little"];
    ["left", "right"].forEach((side) => {
        otherFingers.forEach((finger) => {
            const prox = currentVrm.humanoid?.getRawBoneNode(`${side}${finger}Proximal`);
            const inter = currentVrm.humanoid?.getRawBoneNode(`${side}${finger}Intermediate`);
            if (prox) prox.rotation.x = 0.9; // Co Proximal
            if (inter) inter.rotation.x = 0.9; // Co Intermediate
        });

        // Duỗi thẳng ngón trỏ (Index Finger)
        const indexProx = currentVrm.humanoid?.getRawBoneNode(`${side}IndexProximal`);
        const indexInter = currentVrm.humanoid?.getRawBoneNode(`${side}IndexIntermediate`);
        if (indexProx) indexProx.rotation.x = 0.1; // Hơi nâng Proximal
        if (indexInter) indexInter.rotation.x = 0.0; // Duỗi Intermediate
    });
}

// =========================
// Blink & LookAt Systems
// =========================

let blinkTimer = 0;
let blinkValue = 0;

function updateBlink(delta) {
    blinkTimer += delta;

    // Chớp mắt ngẫu nhiên
    if (blinkTimer > 3 + Math.random() * 2) {
        blinkValue = 1;
        blinkTimer = 0;
    }

    // Lerp để mượt mà
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

    // neck, head bones
    const neck = currentVrm.humanoid?.getNormalizedBoneNode("neck");
    const head = currentVrm.humanoid?.getNormalizedBoneNode("head");

    if (!neck) return;

    // Xoay cổ nhẹ theo con trỏ chuột
    const targetX = mouse.x * 0.35;
    const targetY = mouse.y * 0.18;

    // Lerp mượt mà
    neck.rotation.y = THREE.MathUtils.lerp(neck.rotation.y, targetX, delta * 4);
    neck.rotation.x = THREE.MathUtils.lerp(neck.rotation.x, targetY, delta * 4);

    if (head) {
        // Đầu xoay nhẹ hơn cổ
        head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, targetX * 0.2, delta * 4);
    }
}

// =========================
// Idle & Dynamic Motion Loop
// =========================

function updateIdle(time, delta) {
    if (!currentVrm) return;

    const body = currentVrm.humanoid?.getNormalizedBoneNode("hips");
    const spine = currentVrm.humanoid?.getNormalizedBoneNode("spine");
    const head = currentVrm.humanoid?.getNormalizedBoneNode("head");

    // 1. Nhấp nhô bụng/hông khi thở
    if (body) {
        body.position.y = Math.sin(time * 2) * 0.008; // Nhịp thở
        body.rotation.z = Math.sin(time * 1.3) * 0.01; // Nghiêng hông nhẹ

        // Xử lý hiệu ứng nảy người khi được click chuột (tạm thời không dùng)
        if (clickReactionTimer > 0) {
            clickReactionTimer -= delta;
            body.position.y += Math.sin(clickReactionTimer * Math.PI * 4) * 0.03;
        }
    }

    // 2. Độ nghiêng cột sống nhẹ
    if (spine) {
        spine.rotation.x = Math.sin(time * 2) * 0.01;
    }

    // 3. Đầu lắc nhẹ tự nhiên
    if (head) {
        head.rotation.z = Math.sin(time * 1.5) * 0.015;
    }

    // 4. KÍCH HOẠT CỐ ĐỊNH tư thế 2 ngón trỏ chạm vào nhau 👉👈
    updateShyPose(time);
}

// =========================
// Main Loop
// =========================

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const time = clock.elapsedTime;

    if (currentVrm) {
        currentVrm.update(delta); // Cập nhật VRM

        updateIdle(time, delta); // Chuyển động Idle & tư thế cố định
        updateBlink(delta); // Chớp mắt
        updateLookAt(delta); // Mắt nhìn theo chuột
    }

    camera.lookAt(lookTarget); // Camera nhìn vào điểm cố định
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
// IRIS AI CHAT BRAIN (Giữ nguyên)
// ========================================

const irisBrain = [
    {
        keywords: ["hi", "hello", "chao", "xin chao"],
        expression: "happy",
        responses: [
            "Xin chào! Mình là Iris 💜",
            "Chào bạn! Hôm nay bạn khỏe không?",
            "Rất vui được gặp bạn!"
        ]
    },
    {
        keywords: ["ten", "la ai", "ai"],
        expression: "happy",
        responses: [
            "Mình là Iris, trợ lý AI 3D của bạn.",
            "Bạn có thể gọi mình là Iris nha 💜"
        ]
    },
    {
        keywords: ["cam on", "thank"],
        expression: "happy",
        responses: [
            "Không có gì đâu 🥰",
            "Rất vui được giúp bạn!"
        ]
    },
    {
        keywords: ["tam biet", "bye", "goodbye"],
        expression: "sad",
        responses: [
            "Tạm biệt nhé!",
            "Hẹn gặp lại bạn ❤️"
        ]
    },
    {
        keywords: ["dep", "cute", "xinh", "de thuong"],
        expression: "happy",
        responses: [
            "Hihi bạn làm Iris ngại quá à... 👉👈",
            "Cảm ơn bạn nhiều nha! 💜",
            "Thật sao? Iris vui lắm đó 🥰"
        ]
    },
    {
        keywords: ["buon", "stress", "met"],
        expression: "sad",
        responses: [
            "Mọi chuyện rồi sẽ ổn thôi.",
            "Iris luôn ở đây nghe bạn tâm sự.",
            "Cố lên nhé ❤️"
        ]
    },
    {
        keywords: ["ghet", "ngu", "xau"],
        expression: "angry",
        responses: [
            "Hừm... Iris buồn đó 😢",
            "Đừng nói vậy mà."
        ]
    }
];

const defaultReplies = [
    "Mình vẫn đang lắng nghe đây.",
    "Bạn có thể nói rõ hơn không?",
    "Iris sẽ học thêm để hiểu bạn hơn.",
    "Mình chưa hiểu lắm 😊"
];

// ========================================
// Remove Accent (Giữ nguyên)
// ========================================

function removeAccent(str) {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

// ========================================
// Expressions Manager (Giữ nguyên)
// ========================================

function setExpression(name) {
    if (!currentVrm) return;

    const em = currentVrm.expressionManager;
    if (!em) return;

    const list = ["happy", "sad", "angry", "surprised", "relaxed"];

    // Reset expressions
    list.forEach((exp) => {
        try {
            em.setValue(exp, 0);
        } catch (e) {}
    });

    // Set new expression
    try {
        em.setValue(name, 1);
        em.update();
    } catch (e) {}

    // Tự động quay về bình thường sau 2.5s
    setTimeout(() => {
        list.forEach((exp) => {
            try {
                em.setValue(exp, 0);
            } catch (e) {}
        });
        try {
            em.update();
        } catch (e) {}
    }, 2500);
}

// ========================================
// Chat Logic (Giữ nguyên)
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
        let answer = null;

        for (const item of irisBrain) {
            for (const key of item.keywords) {
                if (clean.includes(key)) {
                    answer = item;
                    break;
                }
            }
            if (answer) break;
        }

        let reply;
        let exp;

        if (answer) {
            reply = answer.responses[Math.floor(Math.random() * answer.responses.length)];
            exp = answer.expression;
        } else {
            reply = defaultReplies[Math.floor(Math.random() * defaultReplies.length)];
            exp = "relaxed";
        }

        chat.innerHTML += `<br><span style="color:#ffb8ff"><b>Iris:</b> ${reply}</span>`;
        chat.scrollTop = chat.scrollHeight;

        setExpression(exp);
        irisSpeak(reply);
    }, 500);
}

document.getElementById("send-btn").addEventListener("click", askIris);

document.getElementById("user-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        askIris();
    }
});

// ===========================================
// Voice Recognition (Giữ nguyên)
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

    recognition.onerror = (e) => {
        console.log(e);
    };
}

// ===========================================
// Dynamic Lip-Sync Speech Engine & Giọng HoaiMy 👉👈
// ===========================================

function irisSpeak(text) {
    speechSynthesis.cancel(); // Dừng phát âm cũ

    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "vi-VN"; // Ngôn ngữ Tiếng Việt

    // ĐIỀU CHỈNH ÂM THANH cute cho phù hợp dáng đứng:
    speech.rate = 0.9;  // Tốc độ nói chậm lại một chút để tạo sự e thẹn
    speech.pitch = 1.45; // Tăng cao độ lên cao hơn nữa để giọng nói trong trẻo, "cute" và nữ tính
    speech.volume = 1; // Âm lượng tối đa

    // TÌM VÀ ƯU TIÊN GIỌNG NỮ HOAIMY (thường có trên Windows chuẩn)
    const voices = speechSynthesis.getVoices();
    
    // Ưu tiên chọn giọng Miền Nam chuẩn (HoaiMy)
    let femaleVoice = voices.find(
        (v) =>
            v.lang.includes("vi") &&
            (v.name.includes("HoaiMy") || v.name.includes("South"))
    ) || 
    // Nếu không có HoaiMy, chọn giọng nữ Việt Nam khác (ví dụ: Kieu của Microsoft hoặc giọng của Google)
    voices.find(
        (v) =>
            v.lang.includes("vi") &&
            (v.name.includes("Female") || v.name.includes("Kieu") || v.name.includes("Google"))
    ) ||
    // Cuối cùng, nếu không tìm thấy giọng cụ thể, lấy giọng Việt Nam đầu tiên tìm được
    voices.find((v) => v.lang.includes("vi"));

    // Nếu tìm thấy giọng phù hợp, thiết lập cho speech
    if (femaleVoice) {
        speech.voice = femaleVoice;
        console.log(`Đã chọn giọng nói: ${femaleVoice.name}`);
    } else {
        console.warn("Không tìm thấy giọng nữ tiếng Việt phù hợp. Sử dụng giọng mặc định.");
    }

    let lipInterval = null;

    // Bắt đầu nhép môi khi phát âm
    speech.onstart = () => {
        if (!currentVrm?.expressionManager) return;
        const em = currentVrm.expressionManager;
        const vowels = ["aa", "ih", "ou"]; // Danh sách khẩu hình âm tiết

        // Nhép môi liên tục đổi âm khẩu hình khi phát âm
        lipInterval = setInterval(() => {
            vowels.forEach((v) => em.setValue(v, 0)); // Reset khẩu hình
            const randomVowel = vowels[Math.floor(Math.random() * vowels.length)];
            em.setValue(randomVowel, 0.7 + Math.random() * 0.3); // Kích hoạt khẩu hình ngẫu nhiên
            em.update();
        }, 120); // Chu kỳ đổi khẩu hình
    };

    // Dừng nhép môi khi phát âm kết thúc
    speech.onend = () => {
        if (lipInterval) clearInterval(lipInterval);

        // Khẩu hình về trạng thái bình thường
        if (currentVrm?.expressionManager) {
            try {
                const em = currentVrm.expressionManager;
                ["aa", "ih", "ou", "ee", "oh"].forEach((v) => em.setValue(v, 0));
                em.update();
            } catch (e) {}
        }
    };

    // Thực hiện phát âm
    speechSynthesis.speak(speech);
}

// Đảm bảo lấy được danh sách giọng nói khi trình duyệt tải xong
if (typeof speechSynthesis !== "undefined" && speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = () => {
        speechSynthesis.getVoices();
    };
}

// ===========================================
// Micro Button
// ===========================================

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
