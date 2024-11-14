// script.js
const progressBarInner = document.getElementById('progress-bar-inner');
const status = document.getElementById('status');
const epochDisplay = document.getElementById('epoch');
const totalEpochsDisplay = document.getElementById('total-epochs');
const lossDisplay = document.getElementById('loss');
const accuracyDisplay = document.getElementById('accuracy');
const valLossDisplay = document.getElementById('val-loss');
const cpuBar = document.getElementById('cpu-bar');
const gpuBar = document.getElementById('gpu-bar');
const memoryBar = document.getElementById('memory-bar'); 
const gpuUsageBar = document.getElementById('gpu-usage-bar');
const numGpusSelect = document.getElementById('num-gpus');
const gpuPowerSlider = document.getElementById('gpu-power');
const gpuPowerDisplay = document.getElementById('gpu-power-display');
const startTrainingButton = document.getElementById('start-training');
const learningRateDisplay = document.getElementById('learning-rate');
const batchSizeDisplay = document.getElementById('batch-size');
const timeElapsedDisplay = document.getElementById('time-elapsed'); 
const darkModeToggle = document.getElementById('dark-mode-toggle');
const body = document.body;
const container = document.querySelector('.container');
const modelSelect = document.getElementById('model-select');
const modelOptions = document.getElementById('model-options');
const modelTypeDisplay = document.getElementById('model-type');
const datasetDisplay = document.getElementById('dataset');
const optimizerDisplay = document.getElementById('optimizer');
const logsWindow = document.getElementById('logs');
const gpuSelect = document.getElementById('gpu-select');
const cpuSelect = document.getElementById('cpu-select'); 
const memorySelect = document.getElementById('memory-select'); 
const storageSelect = document.getElementById('storage-select'); 
const learningRateSlider = document.getElementById('learning-rate-slider');
const learningRateDisplaySpan = document.getElementById('learning-rate-display');
const batchSizeSlider = document.getElementById('batch-size-slider');
const batchSizeDisplaySpan = document.getElementById('batch-size-display');

let epoch = 0;
let loss = 1.0;
let accuracy = 0.0;
let valLoss = 1.2;
let learningRate = 0.001;
let batchSize = 32;
let isTraining = false;
let trainingProgressInterval;
let totalEpochs = 200;
let currentModel = "cnn"; 
let selectedGpu = "nvidia-rtx-3090"; 
let selectedCpu = "intel-core-i9-13900k"; 
let ramSize = 16;
let storageType = "SSD";
let startTime;
let timeElapsedInterval;

// Hardware Performance Estimates (Approximate values)
const gpuPerformance = {
    "nvidia-rtx-3090": 1.0, 
    "nvidia-rtx-4090": 1.5,
    "nvidia-a100": 2.0,
    "amd-radeon-rx-7900-xt": 0.8,
    "intel-arc-a770": 0.6
};

const cpuPerformance = {
    "intel-core-i9-13900k": 1.2, 
    "amd-ryzen-9-7950x": 1.1,
};

const modelConfig = {
    cnn: {
        type: "Convolutional Neural Network (CNN)",
        dataset: "CIFAR-10",
        optimizer: "Adam",
        metric: "Accuracy",
        maxEpochs: 200,
        baseEpochTime: 5 
    },
    rnn: {
        type: "Recurrent Neural Network (RNN)",
        dataset: "Shakespeare Text",
        optimizer: "RMSprop",
        metric: "Perplexity",
        maxEpochs: 150,
        baseEpochTime: 10 
    },
    bert: {
        type: "BERT (Bidirectional Encoder Representations from Transformers)",
        dataset: "Sentiment Analysis Dataset",
        optimizer: "AdamW",
        metric: "Accuracy",
        maxEpochs: 10,
        baseEpochTime: 20 
    },
    gan: {
        type: "Generative Adversarial Network (GAN)",
        dataset: "CelebA Faces",
        optimizer: "SGD",
        metric: "Inception Score",
        maxEpochs: 300,
        baseEpochTime: 30 
    },
    transformer: {
        type: "Transformer",
        dataset: "WMT14 English-German",
        optimizer: "Adam",
        metric: "BLEU Score",
        maxEpochs: 50,
        baseEpochTime: 40 
    },
    resnet: {
        type: "ResNet (Residual Network)",
        dataset: "ImageNet",
        optimizer: "SGD",
        metric: "Top-5 Accuracy",
        maxEpochs: 90,
        baseEpochTime: 60 
    }
};

function updateModelInfo() {
    const config = modelConfig[currentModel];
    modelTypeDisplay.textContent = config.type;
    datasetDisplay.textContent = config.dataset;
    optimizerDisplay.textContent = config.optimizer;
    totalEpochs = config.maxEpochs;
    totalEpochsDisplay.textContent = totalEpochs;
    accuracyDisplay.previousSibling.textContent = `${config.metric}: `;
}

modelSelect.addEventListener('click', () => {
    modelOptions.classList.toggle('show');
});

modelOptions.addEventListener('click', (event) => {
    if (event.target.tagName === 'A') {
        currentModel = event.target.dataset.model;
        modelSelect.textContent = `${event.target.textContent}`;
        updateModelInfo();
        modelOptions.classList.remove('show');
    }
});

updateModelInfo();

function updateGpuPowerDisplay() {
    gpuPowerDisplay.textContent = `${gpuPowerSlider.value}%`;
}

gpuPowerSlider.addEventListener('input', updateGpuPowerDisplay);
updateGpuPowerDisplay();

function logMessage(message) {
    const logEntry = document.createElement('p');
    logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logsWindow.appendChild(logEntry);
    logsWindow.scrollTop = logsWindow.scrollHeight; 
}

function updateProgress() {
    if (!isTraining) return;

    epoch++;

    loss = Math.max(0, loss - (Math.random() * 0.08 + 0.02));
    accuracy = Math.min(1, accuracy + (Math.random() * 0.05));
    valLoss = Math.max(0, valLoss - (Math.random() * 0.06 + 0.01));
    learningRate *= 0.999;
    learningRate = parseFloat(learningRate.toFixed(5));

    const progress = (epoch / totalEpochs) * 100;
    progressBarInner.style.width = `${progress}%`;
    status.textContent = `Training Epoch ${epoch}/${totalEpochs} (${progress.toFixed(1)}%)`;

    epochDisplay.textContent = epoch;
    lossDisplay.textContent = loss.toFixed(2);
    accuracyDisplay.textContent = (accuracy * 100).toFixed(2) + (currentModel === 'rnn' ? '' : '%');
    valLossDisplay.textContent = valLoss.toFixed(2);
    learningRateDisplay.textContent = learningRate;

    // Calculate CPU usage
    const cpuUsage = 30 + (Math.random() * 40); 
    cpuBar.style.width = `${cpuUsage}%`;

    // Calculate GPU usage
    const maxGpuUsage = parseInt(gpuPowerSlider.value) * parseInt(numGpusSelect.value);
    const gpuUsage = Math.min(maxGpuUsage, 30 + Math.random() * 50); 
    gpuBar.style.width = `${gpuUsage}%`;

    const memoryUsage = 40 + (Math.random() * 30); 
    memoryBar.style.width = `${memoryUsage}%`; 

    // Time Elapsed Calculation
    const elapsedTime = Math.round((Date.now() - startTime) / 1000); 
    const hours = Math.floor(elapsedTime / 3600);
    const minutes = Math.floor((elapsedTime % 3600) / 60);
    const seconds = elapsedTime % 60;
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    timeElapsedDisplay.textContent = formattedTime;

    // Simulate Errors (adjust probability as needed)
    if (Math.random() < 0.05 && epoch > 5) {
        const errorMessage = `Epoch ${epoch}: Error: [Simulated Error Message - Adjust based on your error types]`;
        logMessage(errorMessage);
    }

    // ... (error handling, data loading simulation, etc.) ...

    if (epoch >= totalEpochs) {
        status.textContent = "Training Complete!";
        isTraining = false;
        startTrainingButton.textContent = "Start Training";
        clearInterval(trainingProgressInterval);
        clearInterval(timeElapsedInterval); 
        logMessage("Training finished.");
    }
}

darkModeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    container.classList.toggle('dark-mode');
});


startTrainingButton.addEventListener('click', () => {
    if (!isTraining) {
        isTraining = true;
        startTrainingButton.textContent = "Stop Training";
        epoch = 0;
        loss = 1.0;
        accuracy = 0;
        valLoss = 1.2;
        learningRate = 0.001;
        progressBarInner.style.width = '0%';
        status.textContent = "Training Started...";
        logsWindow.innerHTML = ''; 
        logMessage("Training started.");

        startTime = Date.now(); 
        timeElapsedInterval = setInterval(() => {
            updateProgress();
        }, 1000);
        updateTrainingInterval();
    } else {
        isTraining = false;
        startTrainingButton.textContent = "Start Training";
        status.textContent = "Training Paused.";
        clearInterval(trainingProgressInterval);
        clearInterval(timeElapsedInterval);
        logMessage("Training paused.");
    }
});

gpuSelect.addEventListener('change', () => {
    selectedGpu = gpuSelect.value;
    updateTrainingInterval(); 
});

cpuSelect.addEventListener('change', () => { 
    selectedCpu = cpuSelect.value;
    updateTrainingInterval(); 
});

memorySelect.addEventListener('change', () => {
    ramSize = parseInt(memorySelect.value);
    // You might want to add logic here to simulate memory usage
});

storageSelect.addEventListener('change', () => {
    storageType = storageSelect.value;
    // Add logic here to simulate storage speed impact (if applicable)
});

// Function to update training interval based on hardware
function updateTrainingInterval() {
    const gpuMultiplier = gpuPerformance[selectedGpu];
    const cpuMultiplier = cpuPerformance[selectedCpu];
    const modelEpochTime = modelConfig[currentModel].baseEpochTime * (100 / parseInt(gpuPowerSlider.value)) * (1 / gpuMultiplier) * (1 / cpuMultiplier);
    trainingProgressInterval = setInterval(updateProgress, modelEpochTime * 1000); 
}

// Learning rate slider 
learningRateSlider.addEventListener('input', () => {
  learningRate = parseFloat(learningRateSlider.value);
  learningRateDisplaySpan.textContent = learningRate.toFixed(3); 
});

// Batch size slider 
batchSizeSlider.addEventListener('input', () => {
  batchSize = parseInt(batchSizeSlider.value);
  batchSizeDisplaySpan.textContent = batchSize; 
});

// Initialize Hardware Options (Populate select elements)
window.onload = function () {
    const gpuOptions = Object.keys(gpuPerformance);
    const cpuOptions = Object.keys(cpuPerformance);
    const memoryOptions = [8, 16, 32, 64]; 
    const storageOptions = ["SSD", "HDD"]; 

    const gpuSelect = document.getElementById('gpu-select');
    const cpuSelect = document.getElementById('cpu-select');
    const memorySelect = document.getElementById('memory-select');
    const storageSelect = document.getElementById('storage-select');

    gpuOptions.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option;
        opt.text = option.split('-').pop(); // Get the GPU name
        gpuSelect.add(opt);
    });

    cpuOptions.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option;
        opt.text = option.split('-').pop(); // Get the CPU name
        cpuSelect.add(opt);
    });

    memoryOptions.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option;
        opt.text = `${option} GB`;
        memorySelect.add(opt);
    });

    storageOptions.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option;
        opt.text = option;
        storageSelect.add(opt);
    });
}