import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import Tree from './Tree.vue'
import TreeItem from './TreeItem.vue'
import { filesManagerService } from '../services/filesManager'
import { createRouter, createWebHistory } from 'vue-router'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString()
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    })
  }
})()
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Setup Router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'Login', component: { template: '<div>Login</div>' } }
  ]
})

// Helper to mount the component
function mountTree() {
    return mount(Tree, {
        global: {
            plugins: [router],
        }
    })
}

describe('Tree.vue', () => {

    beforeEach(() => {
        vi.restoreAllMocks() // Restore original implementations
        localStorageMock.clear()
        localStorageMock.setItem('jwt_token', 'TEST_TOKEN')
        
        // Spy on all service methods
        vi.spyOn(filesManagerService, 'getTree').mockResolvedValue({ dirs: {}, files: {} })
        vi.spyOn(filesManagerService, 'getDirContent').mockResolvedValue({ files: {} })
        vi.spyOn(filesManagerService, 'addFile').mockResolvedValue({})
        vi.spyOn(filesManagerService, 'addDir').mockResolvedValue({})
        vi.spyOn(filesManagerService, 'editFile').mockResolvedValue({})
        vi.spyOn(filesManagerService, 'editDir').mockResolvedValue({})
        vi.spyOn(filesManagerService, 'delFile').mockResolvedValue({})
        vi.spyOn(filesManagerService, 'delDir').mockResolvedValue({})
        vi.spyOn(filesManagerService, 'logout').mockResolvedValue({})
        
        // Clean up body for Teleport tests
        document.body.innerHTML = ''
        // Create app placeholder if needed by mount (mount appends to a div usually)
    })

    it('should create the component', () => {
        const wrapper = mountTree()
        expect(wrapper.exists()).toBe(true)
    })

    // ------------------------------------
    // Functional tests
    // ------------------------------------

    it('should load directories and files correctly on initialization', async () => {
        vi.mocked(filesManagerService.getTree).mockResolvedValue({
            dirs: { "1": { name: "DirA" } },
            files: { "2": { name: "FileRoot" } },
        });

        vi.mocked(filesManagerService.getDirContent).mockResolvedValue({
            files: { "3": { name: "NestedFileA" } }
        });

        const wrapper = mountTree()
        await flushPromises()

        expect(filesManagerService.getTree).toHaveBeenCalledWith('TEST_TOKEN')
        expect(filesManagerService.getDirContent).toHaveBeenCalledWith('TEST_TOKEN', 1)

        const treeItems = wrapper.findAllComponents(TreeItem)
        const dirA = treeItems.find(item => item.props('node').name === 'DirA')
        expect(dirA).toBeDefined()
        expect(dirA?.props('node').type).toBe('D')
        expect(dirA?.props('node').children[0].name).toBe('NestedFileA')

        const fileRoot = treeItems.find(item => item.props('node').name === 'FileRoot')
        expect(fileRoot).toBeDefined()
    })

    it('should not load the tree if the authentication token is missing', async () => {
        localStorageMock.removeItem('jwt_token');
        
        mountTree()
        await flushPromises()

        expect(filesManagerService.getTree).not.toHaveBeenCalled()
    })

    it('should continue loading other directories even if one fails', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

        vi.mocked(filesManagerService.getTree).mockResolvedValue({
            dirs: { "1": { name: "DirA" }, "2": { name: "DirB" } },
            files: {},
        });

        vi.mocked(filesManagerService.getDirContent).mockImplementation(async (token: string, id: number) => {
            if (id === 1) throw new Error("Network error")
            return { files: {} }
        });

        mountTree()
        await flushPromises()

        expect(filesManagerService.getDirContent).toHaveBeenCalledTimes(2)
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Failed to load content for dir 1"), expect.any(Error))
        
        consoleSpy.mockRestore()
    })

    // ------------------------------------
    // Selection tests
    // ------------------------------------

    it('should select a file', async () => {
         vi.mocked(filesManagerService.getTree).mockResolvedValue({
            dirs: {},
            files: { "2": { name: "FileRoot" } },
        });

        const wrapper = mountTree()
        await flushPromises()

        const fileItem = wrapper.findComponent(TreeItem)
        await fileItem.find('.tree-node-content').trigger('click')

        expect(fileItem.find('.tree-node-content').classes()).toContain('selected')
    })

    it('should toggle directory expansion but not select it', async () => {
        vi.mocked(filesManagerService.getTree).mockResolvedValue({
            dirs: { "1": { name: "DirA" } },
            files: {},
        });
        vi.mocked(filesManagerService.getDirContent).mockResolvedValue({ files: {} });

        const wrapper = mountTree()
        await flushPromises()

        const dirItem = wrapper.findComponent(TreeItem)
        const toggleIcon = dirItem.find('.toggle-icon')
        
        expect(toggleIcon.text()).toBe('▶')
        
        await dirItem.find('.tree-node-content').trigger('click')
        expect(toggleIcon.text()).toBe('▼')
        
        expect(dirItem.find('.tree-node-content').classes()).not.toContain('selected')
    })

    // ------------------------------------
    // Creation & Modal Tests
    // ------------------------------------

    it('should open modal for root file creation', async () => {
        const wrapper = mountTree()
        await flushPromises()

        const newFileBtn = wrapper.findAll('.root-menu div')[0]
        await newFileBtn.trigger('click')
        await flushPromises()

        const modal = document.querySelector('.modal')
        expect(modal).not.toBeNull()
        expect(modal?.querySelector('h3')?.textContent).toBe('Create New File')
    })

    it('should create a file and update tree', async () => {
        vi.mocked(filesManagerService.getTree).mockResolvedValue({ dirs: {}, files: {} });
        vi.mocked(filesManagerService.addFile).mockResolvedValue({});

        const wrapper = mountTree()
        await flushPromises()

        // Open modal
        await wrapper.findAll('.root-menu div')[0].trigger('click')
        await flushPromises()
        
        // Fill input
        const input = document.querySelector('.modal input') as HTMLInputElement
        input.value = 'new-file.txt'
        input.dispatchEvent(new Event('input')) // Trigger v-model update
        
        // Click Save
        const saveBtn = document.querySelectorAll('.modal-actions button')[1] as HTMLButtonElement
        saveBtn.click()
        await flushPromises()

        expect(filesManagerService.addFile).toHaveBeenCalledWith('TEST_TOKEN', 'new-file.txt', null)
        expect(filesManagerService.getTree).toHaveBeenCalledTimes(2)
    })

    it('should create a directory and update tree', async () => {
        vi.mocked(filesManagerService.getTree).mockResolvedValue({ dirs: {}, files: {} });
        vi.mocked(filesManagerService.addDir).mockResolvedValue({});

        const wrapper = mountTree()
        await flushPromises()

        // Open modal for New Dir (2nd item in menu)
        await wrapper.findAll('.root-menu div')[1].trigger('click')
        await flushPromises()
        
        // Fill input
        const input = document.querySelector('.modal input') as HTMLInputElement
        input.value = 'new-dir'
        input.dispatchEvent(new Event('input'))
        
        // Fill context
        const textarea = document.querySelector('.modal textarea') as HTMLTextAreaElement
        expect(textarea).not.toBeNull()
        textarea.value = 'dir context'
        textarea.dispatchEvent(new Event('input'))

        // Click Save
        const saveBtn = document.querySelectorAll('.modal-actions button')[1] as HTMLButtonElement
        saveBtn.click()
        await flushPromises()

        expect(filesManagerService.addDir).toHaveBeenCalledWith('TEST_TOKEN', 'new-dir', 'dir context', null)
        expect(filesManagerService.getTree).toHaveBeenCalledTimes(2)
    })

    // ------------------------------------
    // Deletion Tests
    // ------------------------------------

    it('should open confirmation dialog on delete', async () => {
        vi.mocked(filesManagerService.getTree).mockResolvedValue({
            dirs: {},
            files: { "10": { name: "delete-me.txt" } },
        });

        const wrapper = mountTree()
        await flushPromises()

        const fileItem = wrapper.findComponent(TreeItem)
        await fileItem.find('.node-actions-trigger').trigger('click')
        
        // Need to wait for Vue updates if needed, though click triggers direct logic
        const deleteBtn = fileItem.findAll('.context-menu div')[1]
        await deleteBtn.trigger('click')
        await flushPromises()

        const confirmDialog = document.querySelector('.modal h3')
        expect(confirmDialog?.textContent).toBe('Confirm Action')
    })

    it('should call delFile on confirm delete', async () => {
        vi.mocked(filesManagerService.getTree).mockResolvedValue({
            dirs: {},
            files: { "10": { name: "delete-me.txt" } },
        });
        vi.mocked(filesManagerService.delFile).mockResolvedValue({});

        const wrapper = mountTree()
        await flushPromises()

        // Open delete dialog
        const fileItem = wrapper.findComponent(TreeItem)
        await fileItem.find('.node-actions-trigger').trigger('click')
        await fileItem.findAll('.context-menu div')[1].trigger('click')
        await flushPromises()
        
        // Click Delete in Confirm Dialog
        const deleteBtn = document.querySelector('.modal-actions .danger') as HTMLButtonElement
        deleteBtn.click()
        await flushPromises()

        expect(filesManagerService.delFile).toHaveBeenCalledWith('TEST_TOKEN', 10)
        expect(filesManagerService.getTree).toHaveBeenCalledTimes(2)
    })

    // ------------------------------------
    // Logout Tests
    // ------------------------------------
    it('should call logout service and clear token', async () => {
        // Mock window.location.reload
        const reloadSpy = vi.fn()
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: { reload: reloadSpy }
        })

        const wrapper = mountTree()
        await flushPromises()

        await wrapper.findAll('.root-menu div')[2].trigger('click')
        await flushPromises()

        expect(filesManagerService.logout).toHaveBeenCalledWith('TEST_TOKEN')
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('jwt_token')
        expect(reloadSpy).toHaveBeenCalled()
    })

})
