<template>
    <ActivityView>
        <ActivityTitle>{{ pageTitle }}</ActivityTitle>
        <ActivityBody>
            <div class="providers-management">
                <!-- 全局提供商管理 -->
                <el-card class="management-card">
                    <template #header>
                        <div class="card-header">
                            <span>AI 服务提供商列表</span>
                            <el-button type="primary" plain @click="handleAddProvider" :icon="Plus">
                                添加提供商
                            </el-button>
                        </div>
                    </template>

                    <el-table :data="customProviders" stripe style="width: 100%">
                        <el-table-column prop="name" label="提供商名称" min-width="150" />
                        <el-table-column prop="endpoint" label="API Endpoint" min-width="250">
                            <template #default="{ row }">
                                <span class="endpoint-text">{{ row.endpoint }}</span>
                            </template>
                        </el-table-column>
                        <el-table-column prop="apiKey" label="API Key" width="120">
                            <template #default="{ row }">
                                <el-tag v-if="row.apiKey" type="success">已配置</el-tag>
                                <el-tag v-else type="danger">未配置</el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column label="操作" width="180">
                            <template #default="{ row, $index }">
                                <el-button size="small" @click="handleEditProvider(row, $index)" :icon="Edit">
                                    编辑
                                </el-button>
                                <el-button size="small" type="danger" @click="handleDeleteProvider($index)" :icon="Delete">
                                    删除
                                </el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                </el-card>

                <!-- 服务配置 -->
                <el-card class="service-config-card">
                    <template #header>
                        <span>服务配置</span>
                    </template>

                    <!-- 服务配置 -->
                    <div v-for="(service, serviceKey) in services" :key="serviceKey" class="service-config">
                        <h4>{{ service.name }}</h4>
                        <div class="config-row">
                            <div class="config-item">
                                <label>选择提供商</label>
                                <!-- 如果 __index__ 是 -1 ，把选择框标红 -->
                                <el-select v-model="user_service[serviceKey].provider.__index__" placeholder="请选择服务提供商" style="width: 100%;" :class="{'is-invalid': user_service[serviceKey].provider.__index__ === -1}">
                                    <el-option
                                        v-for="(provider, index) in customProviders"
                                        :key="index"
                                        :label="provider.name"
                                        :value="index"
                                        :disabled="!provider.apiKey"
                                    >
                                        <span>{{ provider.name }}</span>
                                        <el-tag v-if="!provider.apiKey" size="small" type="danger" style="margin-left: 8px;">
                                            未配置Key
                                        </el-tag>
                                    </el-option>
                                </el-select>
                            </div>
                            <div class="config-item">
                                <label>选择模型</label>
                                <el-input v-model="user_service[serviceKey].provider.model" placeholder="输入模型ID，如: gpt-4o" />
                            </div>
                        </div>
                    </div>

                    <!-- 其他服务配置可以在这里扩展 -->
                    <div class="action-buttons">
                        <el-button type="primary" plain @click="saveServiceConfig">保存配置</el-button>
                    </div>
                </el-card>
            </div>

            <!-- 添加/编辑提供商对话框 -->
            <DialogView v-model="providerDialogVisible" class="provider-dialog">
                <template #title>{{ isEditingProvider ? '编辑提供商' : '添加提供商' }}</template>
                <form class="dialog-content">
                    <!-- 预设提供商快速选择 -->
                    <div class="preset-section" v-if="!isEditingProvider">
                        <h4>快速选择预设提供商&nbsp;<ElCheckbox v-model="showPresetProviders">点击显示</ElCheckbox></h4>
                        <div class="preset-list" v-show="showPresetProviders">
                            <el-card
                                v-for="preset in presetProviders"
                                :key="preset.name"
                                class="preset-card"
                                @click="selectPresetProvider(preset)"
                                tabindex="0" role="button"
                                @keydown.enter="selectPresetProvider(preset)"
                            >
                                <div class="preset-content">
                                    <div class="preset-info">
                                        <div class="preset-name">{{ preset.name }}</div>
                                        <div class="preset-desc">{{ preset.description }}</div>
                                    </div>
                                    <el-button type="primary" text @click.stop="visitPurchasePage(preset)">
                                        获取Key
                                    </el-button>
                                </div>
                            </el-card>
                        </div>
                    </div>

                    <!-- 自定义配置 -->
                    <div class="custom-section">
                        <h4>{{ isEditingProvider ? '编辑配置' : '自定义配置' }}</h4>
                        <div class="form-item">
                            <label>提供商名称</label>
                            <el-input v-model="currentProvider.name" clearable placeholder="输入提供商名称" />
                        </div>
                        <div class="form-item">
                            <label>API Endpoint</label>
                            <el-input v-model="currentProvider.endpoint" clearable placeholder="https://api.example.com/v1" />
                        </div>
                        <div class="form-item">
                            <label>API Key</label>
                            <el-input
                                v-model="currentProvider.apiKey"
                                type="password"
                                placeholder="输入 API Key" 
                                clearable
                                show-password
                            />
                        </div>
                    </div>

                    <div class="dialog-actions">
                        <el-button @click="providerDialogVisible = false">取消</el-button>
                        <el-button type="primary" @click="saveProvider" plain ref="saveProviderBtn">
                            {{ isEditingProvider ? '保存' : '添加' }}
                        </el-button>
                    </div>
                </form>
            </DialogView>
        </ActivityBody>
    </ActivityView>
</template>

<script setup>
import { onMounted, ref, reactive, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Edit, Delete } from '@element-plus/icons-vue';
import { db } from '@/userdata';

const pageTitle = ref('AI 服务提供商设置');

const $emit = defineEmits(['update-title']);

// 响应式数据
const presetProviders = ref([]);
const customProviders = ref([]);
const providerDialogVisible = ref(false);
const isEditingProvider = ref(false);
const editingIndex = ref(-1);
const showPresetProviders = ref(true);
const saveProviderBtn = ref(null);

const currentProvider = reactive({
    id: '',
    name: '',
    endpoint: '',
    apiKey: '',
    description: '',
});

const services = ({
    ocr: {
        name: '文字识别服务',
        description: '文字识别服务',
        provider: {
            id: '',
            model: '',
            __index__: -1,
        },
    },
    grading: {
        name: '作文批改服务',
        description: '作文批改与评分',
        provider: {
            id: '',
            model: '',
            __index__: -1,
        },
    },
}); // 模板对象

const user_service = ref(structuredClone(services)); // 用户配置

// 生命周期
onMounted(async () => {
    $emit('update-title', pageTitle.value);
    await loadPresetProviders();
    await loadCustomProviders();
    await loadServiceConfig();
});

// 方法
const loadPresetProviders = async () => {
    try {
        const response = await fetch('/assets/providers.json');
        presetProviders.value = await response.json();
    } catch (error) {
        ElMessage.error('加载预设提供商列表失败' + error);
    }
};

const loadCustomProviders = async () => {
    try {
        const providers = await db.get('config', 'user.ai_providers') || [];
        customProviders.value = providers;
    } catch (error) {
        ElMessage.error('加载自定义提供商列表失败' + error);
        customProviders.value = [];
    }
};

const loadServiceConfig = async () => {
    try {
        for (const i in services) {
            const value = await db.get('config', `services.api.${i}.provider`);
            if (value) {
                user_service.value[i].provider = value;
                // 修正__index__
                user_service.value[i].provider.__index__ = customProviders.value.findIndex(p => p.id === value.id);
            }
        }
    } catch (error) {
        console.error('加载服务配置失败:', error);
    }
};

const handleAddProvider = () => {
    isEditingProvider.value = false;
    editingIndex.value = -1;
    Object.assign(currentProvider, {
        id: '',
        name: '',
        endpoint: '',
        apiKey: '',
        description: '',
    });
    providerDialogVisible.value = true;
};

const handleEditProvider = (provider, index) => {
    isEditingProvider.value = true;
    editingIndex.value = index;
    Object.assign(currentProvider, { ...provider });
    providerDialogVisible.value = true;
};

const handleDeleteProvider = async (index) => {
    try {
        await ElMessageBox.confirm(
            '确定要删除这个提供商吗？',
            '确认删除',
            { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
        );
        
        customProviders.value.splice(index, 1);
        // 修改数组，需要刷新index
        await loadServiceConfig();
        await saveCustomProviders();
        ElMessage.success('删除成功');
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error('删除失败');
        }
    }
};

const selectPresetProvider = (preset) => {
    currentProvider.name = preset.name;
    currentProvider.endpoint = preset.endpoint;
    currentProvider.description = preset.description;
    // 滚动到可见区域
    saveProviderBtn.value.ref.scrollIntoView({ behavior: 'smooth' });
};

const visitPurchasePage = (preset) => {
    if (preset.purchase_url) {
        window.open(preset.purchase_url, '_blank');
    }
};

const saveProvider = async () => {
    if (!currentProvider.name.trim()) {
        ElMessage.warning('请输入提供商名称');
        return;
    }
    if (!currentProvider.endpoint.trim()) {
        ElMessage.warning('请输入 API Endpoint');
        return;
    }

    try {
        if (isEditingProvider.value) {
            customProviders.value[editingIndex.value] = { ...currentProvider };
        } else {
            currentProvider.id = crypto.randomUUID();
            customProviders.value.push({ ...currentProvider });
        }
        
        await saveCustomProviders();
        // 修改数组，需要刷新index
        await loadServiceConfig();
        providerDialogVisible.value = false;
        ElMessage.success(isEditingProvider.value ? '保存成功' : '添加成功');
    } catch (error) {
        ElMessage.error('保存失败');
    }
};

const saveCustomProviders = async () => {
    // 由于含有Proxy,我们只能先转换为普通对象再保存
    await db.put('config', JSON.parse(JSON.stringify(customProviders.value)), 'user.ai_providers');
};

const saveServiceConfig = async () => {
    try {
        // 把 index 同步 provider
        for (const i in user_service.value) {
            const index = user_service.value[i].provider.__index__;
            if (index !== -1) {
                user_service.value[i].provider.id = customProviders.value[index].id;
            }
        }
        for (const i in user_service.value) {
            await db.put('config', JSON.parse(JSON.stringify(user_service.value[i].provider)), `services.api.${i}.provider`);
        }
        ElMessage.success('配置保存成功');
    } catch (error) {
        ElMessage.error('保存配置失败');
    }
};
</script>

<style scoped>
.providers-management {
    padding: 20px;
}

.management-card, .service-config-card {
    margin-bottom: 20px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.endpoint-text {
    font-family: 'Courier New', monospace;
    font-size: 12px;
    color: #666;
}

.service-config {
    margin-bottom: 20px;
}

.service-config h4 {
    margin-bottom: 16px;
    color: #303133;
}

.config-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
}

.config-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.config-item label {
    font-size: 14px;
    font-weight: 500;
    color: #606266;
}

:deep(.config-item > .is-invalid) * {
    --el-select-multiple-input-color: red !important;
    --el-text-color-regular: red !important;
}

.action-buttons {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
}

/* 对话框样式 */
.provider-dialog {
    width: 90%;
    max-width: 800px;
    height: 80%;
}

.dialog-content {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.preset-section {
    flex-shrink: 0;
}

.preset-section h4 {
    margin-bottom: 12px;
}

.preset-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 12px;
}

.preset-card {
    cursor: pointer;
    transition: all 0.3s ease;
}

.preset-card:hover {
    border-color: #409eff;
    transform: translateY(-2px);
}

.preset-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
}

.preset-info {
    flex: 1;
}

.preset-name {
    font-weight: bold;
    margin-bottom: 4px;
}

.preset-desc {
    font-size: 12px;
    color: #909399;
    margin-bottom: 4px;
}

.preset-endpoint {
    font-family: 'Courier New', monospace;
    font-size: 11px;
    color: #c0c4cc;
}

.custom-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.custom-section h4 {
    margin-bottom: 8px;
}

.form-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.form-item label {
    font-size: 14px;
    font-weight: 500;
    color: #606266;
}

.dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    flex-shrink: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .providers-management {
        padding: 12px;
    }
    
    .config-row {
        grid-template-columns: 1fr;
    }
    
    .preset-list {
        grid-template-columns: 1fr;
    }
    
    .provider-dialog {
        width: 95%;
        height: 90%;
    }
}
</style>