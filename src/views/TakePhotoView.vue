<template>
  <DialogView class="container" v-model="dialogVisible">
    <template #title>拍照</template>

    <div class="take-photo-activity">
      <!-- 摄像头选择 -->
      <div class="camera-selector">
        <span class="selector-label">选择摄像头：</span>
        <ElSelect v-model="selectedCameraId" :teleported="false" :append-to="dialogContainer" @change="onCameraChange">
          <ElOption v-for="device in cameraDevices" :key="device.deviceId"
            :label="device.label || `摄像头 ${device.deviceId.slice(0, 8)}`" :value="device.deviceId" />
        </ElSelect>
      </div>

      <!-- 视频预览容器 -->
      <div class="video-container">
        <video ref="videoRef" autoplay playsinline class="video-element" />

        <!-- 可点击区域 -->
        <div class="video-click-area" tabindex="0" @click="takePhoto" @keydown.enter="takePhoto"></div>

        <!-- 覆盖层提示 -->
        <div v-if="!isStreamActive && !permissionDenied" class="video-overlay video-placeholder">
          <ElIcon :size="48">
            <VideoCamera />
          </ElIcon>
          <p>点击拍照</p>
        </div>

        <div v-if="permissionDenied" class="video-overlay permission-denied">
          <ElIcon :size="48" color="#f56c6c">
            <Warning />
          </ElIcon>
          <p>摄像头权限被拒绝</p>
          <ElButton size="small" @click.stop="retryPermission">
            重试
          </ElButton>
        </div>

      </div>
    </div>
  </DialogView>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue'
import { ElSelect, ElOption, ElButton, ElIcon, ElMessage } from 'element-plus'
import { VideoCamera, Warning } from '@element-plus/icons-vue'
import { useDevicesList } from '@vueuse/core'

const dialogVisible = ref(false)
const { videoInputs: cameraDevices, ensurePermissions } = useDevicesList({
  requestPermissions: false,
  constraints: { video: true, audio: false }
})

const selectedCameraId = ref('')
const videoRef = ref(null)
const mediaStream = ref(null)
const isStreamActive = ref(false)
const permissionDenied = ref(false)
const dialogContainer = ref(document.body)

const emit = defineEmits(['shot'])

const request = async () => {
  dialogVisible.value = true
  await nextTick()

  const hasPermission = await ensurePermissions()
  if (!hasPermission) {
    permissionDenied.value = true
    ElMessage.error('需要摄像头权限')
    return
  }

  permissionDenied.value = false

  if (cameraDevices.value.length > 0 && !selectedCameraId.value) {
    selectedCameraId.value = cameraDevices.value[0].deviceId
  } else if (cameraDevices.value.length === 0) {
    ElMessage.error('未检测到摄像头设备')
  }
}

const startCamera = async (deviceId) => {
  stopCamera()
  permissionDenied.value = false

  try {
    mediaStream.value = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    })
    videoRef.value.srcObject = mediaStream.value
    isStreamActive.value = true
  } catch (error) {
    if (error.name === 'NotAllowedError') {
      permissionDenied.value = true
      ElMessage.error('摄像头权限被拒绝')
    } else {
      ElMessage.error('启动摄像头失败: ' + error)
    }
  }
}

const stopCamera = () => {
  mediaStream.value?.getTracks().forEach(track => track.stop())
  mediaStream.value = null
  isStreamActive.value = false
}

const takePhoto = () => {
  if (!isStreamActive.value) return

  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  canvas.width = videoRef.value.videoWidth
  canvas.height = videoRef.value.videoHeight
  context.drawImage(videoRef.value, 0, 0)

  canvas.toBlob((blob) => {
    emit('shot', blob)
    closeDialog()
  }, 'image/png')
}

const onCameraChange = (deviceId) => {
  startCamera(deviceId)
}

const retryPermission = async () => {
  permissionDenied.value = false
  nextTick(() => {
    request()
  })
}

const closeDialog = () => {
  stopCamera()
  dialogVisible.value = false
}

watch(dialogVisible, (visible) => {
  if (!visible) {
    stopCamera()
  } else if (visible && selectedCameraId.value) {
    startCamera(selectedCameraId.value)
  }
})

watch(selectedCameraId, (newVal) => {
  if (newVal && dialogVisible.value) {
    startCamera(newVal)
  }
})

watch(cameraDevices, (newDevices) => {
  if (newDevices.length > 0 && !selectedCameraId.value && dialogVisible.value) {
    selectedCameraId.value = newDevices[0].deviceId
  }
})

defineExpose({ request })
</script>

<style scoped>
.container {
  width: 100%;
  height: 100%;
}

.take-photo-activity {
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
  width: 100%;
  height: 100%;
}

.camera-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  white-space: nowrap;
  flex-shrink: 0;
}

.selector-label {
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}

.video-container {
  flex: 1;
  position: relative;
  border: 2px dashed #dcdfe6;
  border-radius: 4px;
  background: #f5f7fa;
  overflow: hidden;
}

.video-element {
  width: 100%;
  height: 100%;
}

.video-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  pointer-events: none;
}

.video-placeholder {
  color: #909399;
}

.permission-denied {
  color: #f56c6c;
  pointer-events: auto;
}

.video-click-area {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
  outline: none;
}

.video-container:hover {
  border-color: #409eff;
}

* {
  box-sizing: border-box;
}
</style>