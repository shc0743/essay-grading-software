<template>
  <DialogView v-model="open" class="container">
    <template #title>图像处理</template>
    <div class="view">
      <!-- 使用 vue-picture-cropper -->
      <vue-picture-cropper v-if="imageSrc && open" :boxStyle="{
        width: '100%',
        height: '100%',
        backgroundColor: '#f8f8f8',
      }" :img="imageSrc" :options="cropperOptions" @ready="onCropperReady" class="cropper" />

      <div v-else class="empty-state">
        <p>请选择要处理的图片</p>
      </div>

      <!-- 操作按钮区域 -->
      <div class="toolbar">
        <div class="ratio-controls" v-if="0">
          <label>裁剪比例：</label>
          <!-- FIXME: 裁剪比例设置不生效 -->
          <select v-model="selectedRatio" @change="updateRatio">
            <option value="free">自由比例</option>
            <option value="1:1">1:1</option>
            <option value="4:3">4:3</option>
            <option value="16:9">16:9</option>
            <option value="3:2">3:2</option>
          </select>

          <!-- <label style="margin-left: 16px;">输出格式：</label> -->
          <select v-if="0" v-model="outputType">
            <option value="png">PNG</option>
            <option value="jpeg">JPEG</option>
            <option value="webp">WebP</option>
          </select>
        </div>

        <div class="action-buttons">
          <ElButton @click="rotate(-90)">向左旋转</ElButton>
          <ElButton @click="rotate(90)">向右旋转</ElButton>
          <ElButton @click="zoom(0.1)">放大</ElButton>
          <ElButton @click="zoom(-0.1)">缩小</ElButton>
          <ElButton @click="reset">重置</ElButton>
          <ElButton @click="processImage" type="primary" plain style="--color: var(--el-color-primary)">
            <ElIcon>
              <ISelect />
            </ElIcon>
          </ElButton>
          <ElButton @click="cancel" type="danger" plain style="--color: var(--el-color-danger)">
            <ElIcon>
              <CloseBold />
            </ElIcon>
          </ElButton>
        </div>
      </div>
    </div>
  </DialogView>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue';
import VuePictureCropper, { cropper } from 'vue-picture-cropper';
import { ElPopMessage as ElMessage } from 'el-message-in-popover'
import { CloseBold, Select as ISelect } from '@element-plus/icons-vue';

const emit = defineEmits(['update:modelValue', 'result']);

const open = ref(false)

// 响应式数据
const imageSrc = ref('');
const currentFileId = ref(null);
const selectedRatio = ref('free');
const outputType = ref('png');

// 裁剪器配置
const cropperOptions = ref({
  viewMode: 1,
  dragMode: 'crop',
  aspectRatio: NaN, // 自由比例
  background: false,
  autoCropArea: 1,
  restore: false,
  guides: true,
  center: true,
  highlight: false,
  cropBoxMovable: true,
  cropBoxResizable: true,
  toggleDragModeOnDblclick: true,
});

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

  // 重置状态
  selectedRatio.value = 'free';
  outputType.value = 'png';

  await nextTick();
};

// 裁剪器准备就绪
const onCropperReady = () => {

};

// 更新裁剪比例
const updateRatio = () => {
  const ratios = {
    'free': NaN,
    '1:1': 1,
    '4:3': 4 / 3,
    '16:9': 16 / 9,
    '3:2': 3 / 2
  };

  const aspectRatio = ratios[selectedRatio.value];
  cropperOptions.value.aspectRatio = aspectRatio;
};

// 旋转图片
const rotate = (degree) => {
  if (cropper) {
    cropper.rotate(degree);
  }
};

// 缩放图片
const zoom = (ratio) => {
  if (cropper) {
    cropper.zoom(ratio);
  }
};

// 重置
const reset = () => {
  if (cropper) {
    cropper.reset();
    selectedRatio.value = 'free';
    cropperOptions.value.aspectRatio = NaN;
  }
};

// 处理图片并返回结果
const processImage = () => {
  if (!cropper) {
    ElMessage.error('裁剪器未就绪');
    return;
  }

  // 使用 cropper 工具实例获取结果
  cropper.getBlob().then(blob => {
    emit('result', {
      id: currentFileId.value,
      result: blob
    });
    open.value = false;
    clearData();
  }).catch(err => {
    ElMessage.error('获取裁剪图片失败: ' + err);
  });
};

// 取消处理
const cancel = () => {
  open.value = false;
  clearData();
};

// 清理数据
const clearData = () => {
  imageSrc.value = '';
  currentFileId.value = null;
};

// 暴露方法给父组件
defineExpose({
  process
});
</script>

<style scoped>
.container {
  width: 80vw;
  height: 80vh;
  max-width: 1200px;
  max-height: 800px;
}

.view {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
}

.cropper {
  flex: 1;
  min-height: 0;
  background: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
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
  padding-bottom: 0;
  background: white;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.ratio-controls {
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
}

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
</style>