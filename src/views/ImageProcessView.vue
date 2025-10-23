<template>
  <DialogView v-model="open" class="container">
    <template #title>图像处理</template>
    <div class="view">
      <!-- 使用 cropperjs 容器 -->
      <div class="cropper-wrapper" v-if="open && imageSrc" ref="containerRef"></div>

      <div v-else class="empty-state">
        <p>请选择要处理的图片</p>
      </div>

      <!-- 操作按钮区域 -->
      <div class="toolbar">
        <div class="action-buttons">
          <button @click="setAction('rotate')" class="btn">旋转模式</button>
          <button @click="setAction('scale')" class="btn">缩放模式</button>
          <button @click="setAction('move')" class="btn">移动模式</button>
          <button @click="setAction('select')" class="btn">选择模式</button>
          <button @click="reset" class="btn">重置</button>
          <button @click="processImage" class="btn primary">确认处理</button>
          <button @click="cancel" class="btn secondary">取消</button>
        </div>
      </div>
    </div>
  </DialogView>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import Cropper from 'cropperjs';
import { ElPopMessage as ElMessage } from '@/ElPopMessage';

const emit = defineEmits(['update:modelValue', 'result']);

const open = ref(false);
const containerRef = ref(null);
const cropperInstance = ref(null);
const canvasElement = ref(null);

// 响应式数据
const imageSrc = ref('');
const currentFileId = ref(null);
const selectedRatio = ref('free');

// 暴露给外部的方法
const process = async (file_id, file) => {
  currentFileId.value = file_id;

  // 将 Blob 转换为 Data URL
  const reader = new FileReader();
  reader.onload = (e) => {
    imageSrc.value = e.target.result;
  };
  reader.readAsDataURL(file);

  open.value = true;
  selectedRatio.value = 'free';
};

// 监听容器和图片源的变化，初始化 cropper
watch([open, imageSrc, containerRef], async ([isOpen, src, container]) => {
  if (isOpen && src && container) {
    await nextTick();
    initCropper();
  }
});

// 初始化 Cropper 实例
const initCropper = () => {
  if (!containerRef.value || !imageSrc.value) return;

  // 清除容器内容
  containerRef.value.innerHTML = '';

  // 创建图片元素
  const image = document.createElement('img');
  image.src = imageSrc.value;
  image.alt = '待处理图片';
  
  containerRef.value.appendChild(image);

  // 销毁旧的实例
  if (cropperInstance.value) {
    cropperInstance.value.destroy();
  }

  // 使用 Cropper 构造函数
  cropperInstance.value = new Cropper(image, {
    container: containerRef.value,
  });

  // 获取 canvas 元素并设置事件监听
  canvasElement.value = cropperInstance.value.getCropperCanvas();
  if (canvasElement.value) {
    setupEventListeners();
  }
};

// 设置事件监听器
const setupEventListeners = () => {
  if (!canvasElement.value) return;

  canvasElement.value.addEventListener('action', handleAction);
  canvasElement.value.addEventListener('actionstart', handleActionStart);
  canvasElement.value.addEventListener('actionmove', handleActionMove);
  canvasElement.value.addEventListener('actionend', handleActionEnd);
};

// 事件处理函数
const handleAction = (event) => {
  console.log('Action:', event.detail);
  // 处理旋转、缩放等操作
  if (event.detail.action === 'rotate' && event.detail.rotate) {
    console.log('旋转角度:', event.detail.rotate);
  }
  if (event.detail.action === 'scale' && event.detail.scale) {
    console.log('缩放比例:', event.detail.scale);
  }
};

const handleActionStart = (event) => {
  console.log('Action start:', event.detail);
};

const handleActionMove = (event) => {
  console.log('Action move:', event.detail);
};

const handleActionEnd = (event) => {
  console.log('Action end:', event.detail);
};

// 设置操作模式
const setAction = (action) => {
  if (canvasElement.value) {
    canvasElement.value.$setAction(action);
  }
};

// 更新裁剪比例
const updateRatio = () => {
  if (!cropperInstance.value) return;

  const selection = cropperInstance.value.getCropperSelection();
  if (!selection) return;

  const ratios = {
    'free': null,
    '1:1': 1,
    '4:3': 4 / 3,
    '16:9': 16 / 9,
    '3:2': 3 / 2
  };

  const aspectRatio = ratios[selectedRatio.value];
  
  if (aspectRatio) {
    // 设置固定比例
    selection.style.aspectRatio = aspectRatio;
  } else {
    // 自由比例
    selection.style.aspectRatio = 'unset';
  }
};

// 重置
const reset = () => {
  if (cropperInstance.value) {
    cropperInstance.value.destroy();
    initCropper();
  }
  selectedRatio.value = 'free';
};

// 处理图片并返回结果
const processImage = async () => {
  if (!canvasElement.value) {
    ElMessage.error('裁剪器未就绪');
    return;
  }

  try {
    const resultCanvas = await canvasElement.value.$toCanvas({
      beforeDraw: (context, canvas) => {
        // 可以在这里添加图像处理效果
        // context.filter = 'grayscale(50%)';
      }
    });
    
    resultCanvas.toBlob((blob) => {
      if (blob) {
        emit('result', {
          id: currentFileId.value,
          result: blob
        });
        open.value = false;
        clearData();
      } else {
        ElMessage.error('生成裁剪图片失败');
      }
    }, 'image/png', 0.95);
  } catch (err) {
    ElMessage.error('获取裁剪图片失败: ' + err.message);
  }
};

// 取消处理
const cancel = () => {
  open.value = false;
  clearData();
};

// 清理数据和事件监听器
const clearData = () => {
  // 移除事件监听器
  if (canvasElement.value) {
    canvasElement.value.removeEventListener('action', handleAction);
    canvasElement.value.removeEventListener('actionstart', handleActionStart);
    canvasElement.value.removeEventListener('actionmove', handleActionMove);
    canvasElement.value.removeEventListener('actionend', handleActionEnd);
    canvasElement.value = null;
  }

  if (cropperInstance.value) {
    cropperInstance.value.destroy();
    cropperInstance.value = null;
  }
  
  if (containerRef.value) {
    containerRef.value.innerHTML = '';
  }
  
  imageSrc.value = '';
  currentFileId.value = null;
};

// 组件卸载时清理
onUnmounted(() => {
  clearData();
});

// 暴露方法给父组件
defineExpose({
  process
});
</script>

<style scoped>
.container {
  width: 95vw;
  height: 95vh;
  max-width: 1600px;
  max-height: 1200px;
}

.view {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
}

.cropper-wrapper {
  flex: 1;
  min-height: 0;
  background: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  width: 100%;
  height: 100%;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  color: #666;
  font-size: 16px;
}

.toolbar {
  padding: 16px;
  background: white;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

/*.ratio-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ratio-controls label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.ratio-controls select {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  font-size: 14px;
}*/

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  color: #333;
}

.btn:hover {
  background: #f5f5f5;
  border-color: #ccc;
}

.btn.primary {
  background: #1890ff;
  color: white;
  border-color: #1890ff;
}

.btn.primary:hover {
  background: #40a9ff;
  border-color: #40a9ff;
}

.btn.secondary {
  background: #f5f5f5;
  color: #666;
  border-color: #d9d9d9;
}

.btn.secondary:hover {
  background: #e0e0e0;
  border-color: #ccc;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .ratio-controls {
    justify-content: center;
  }

  .action-buttons {
    justify-content: center;
  }
}

:deep(cropper-canvas) {
  width: 100%;
  height: 100%;
}

:deep(cropper-selection) {
  border: 2px solid #1890ff !important;
}
</style>