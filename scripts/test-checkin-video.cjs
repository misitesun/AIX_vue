// Run with: node --test scripts/test-checkin-video.cjs
const { readFileSync } = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const assert = require('node:assert/strict')
const { test } = require('node:test')
const root = path.resolve(__dirname, '..')
const helper = readFileSync(path.join(root, 'src/utils/nativeCheckinVideo.js'), 'utf8').replace(/export /g, '')
const vue = readFileSync(path.join(root, 'src/pages/checkinVideo.vue'), 'utf8')
const script = vue.match(/<script>([\s\S]*?)<\/script>/)[1]
    .replace(/import\s*\{[\s\S]*?\}\s*from\s*['"][^'"]+['"]\s*/, '')
    .replace('export default', 'component =')
function page(native = true) {
    const sent = [], navigation = [], posts = [], timers = new Map(), session = new Map(), events = new Map()
    let timerId = 0
    const window = {
        location: { href: 'https://www.aixquant.net/aix/checkin-video' },
        setTimeout(fn) { const id = ++timerId; timers.set(id, fn); return id },
        clearTimeout(id) { timers.delete(id) },
        setInterval() { return ++timerId }, clearInterval() {},
        addEventListener(type, fn) { events.set(type, fn) },
        removeEventListener(type) { events.delete(type) },
        dispatchEvent(event) { const fn = events.get(event.type); if (fn) fn(event) },
    }
    if (native) {
        window.__AIX_NATIVE_CHECKIN_VIDEO__ = 1
        window.sendMessageToFlutter = value => sent.push(JSON.parse(value))
    }
    const context = vm.createContext({
        component: null, window, document: { addEventListener() {}, removeEventListener() {}, hidden: false },
        URL, Event: class Event { constructor(type) { this.type = type } }, console: { log() {} },
        sessionStorage: { getItem: key => session.get(key), setItem: (key,v) => session.set(key,v), removeItem: key => session.delete(key) },
    })
    vm.runInContext(helper + '\n' + script, context)
    const component = context.component
    const state = Object.assign(component.data(), {
        $refs: {}, $route: { query: { returnTo: '/home' } }, $router: { replace: p => navigation.push(p) },
        $t: t => t, $toast() {}, $nextTick: fn => fn(),
        $http: { post: url => { posts.push(url); return Promise.resolve({ code: 200 }) } },
        $store: { state: { address: 'account' }, commit() {} },
    })
    for (const [key, fn] of Object.entries(component.methods)) state[key] = fn.bind(state)
    for (const [key, fn] of Object.entries(component.computed)) Object.defineProperty(state, key, { get: () => fn.call(state) })
    state.applyVideoInfo({ video_url: 'https://example.com/video.mp4', watch_seconds: 60 })
    const result = (status, watchedMilliseconds, requestId = state.nativeRequestId) =>
        state.handleNativeVideoResult({ detail: { status, requestId, watchedMilliseconds } })
    return { state, sent, posts, navigation, timers, result, component, events, context }
}
const flush = () => new Promise(setImmediate)
test('native request sends source, required seconds and localized labels; ACK clears timeout', () => {
    const p = page()
    assert.equal(p.sent.length, 1)
    assert.equal(p.sent[0].type, 'openCheckinVideo')
    assert.equal(p.sent[0].watchSeconds, 60)
    assert.equal(p.sent[0].labels.close, '关闭视频')
    assert.equal(p.state.useNativeVideo, true)
    assert.equal(p.state.canClose, false)
    p.result('opened')
    assert.equal(p.timers.size, 0)
    assert.equal(p.state.nativeVideoPresented, true)
    p.state.openNativeVideo()
    assert.equal(p.sent.length, 1)
})
test('only matching completion at the required duration submits once and returns home', async () => {
    const p = page()
    const id = p.state.nativeRequestId
    p.result('completed', 60000, 'stale-request')
    assert.equal(p.posts.length, 0)
    p.result('opened')
    p.result('completed', 60000, id)
    p.result('completed', 60000, id)
    await flush()
    assert.deepEqual(p.posts, ['/api/sign_logs'])
    assert.deepEqual(p.navigation, ['/home'])
})
test('short, invalid, failed and cancelled playback never sign in', async () => {
    for (const [status, watched] of [['completed', 59999], ['completed', NaN], ['error', 60000], ['cancelled', 60000]]) {
        const p = page()
        p.result(status, watched)
        await flush()
        assert.deepEqual(p.posts, [])
        assert.equal(p.state.hasVideoError, true)
    }
})
test('native ACK timeout cancels that route; retry ignores its late completion', async () => {
    const p = page()
    const id = p.state.nativeRequestId
    Array.from(p.timers.values())[0]()
    assert.equal(p.state.hasVideoError, true)
    assert.equal(p.sent[1].type, 'cancelCheckinVideo')
    p.state.retryVideo()
    assert.notEqual(p.state.nativeRequestId, id)
    p.result('completed', 60000, id)
    await flush()
    assert.equal(p.posts.length, 0)
})
test('destroyed H5 page cancels native playback and cannot accept a late callback', async () => {
    const p = page()
    const id = p.state.nativeRequestId
    p.component.beforeDestroy.call(p.state)
    assert.equal(p.sent.at(-1).requestId, id)
    assert.equal(p.sent.at(-1).type, 'cancelCheckinVideo')
    p.result('completed', 60000, id)
    await flush()
    assert.equal(p.posts.length, 0)
    assert.equal(p.timers.size, 0)
})
test('ordinary browsers and older Apps retain HTML playback', () => {
    const p = page(false)
    assert.equal(p.state.useNativeVideo, false)
    assert.equal(p.sent.length, 0)
    p.context.window.__FROM_FLUTTER__ = true
    p.context.window.sendMessageToFlutter = () => { throw new Error('legacy app must not open native player') }
    p.state.applyVideoInfo({ video_url: 'https://example.com/video.mp4', watch_seconds: 60 })
    assert.equal(p.state.useNativeVideo, false)
})
test('Vue template compiles and guards native mode from mounting an HTML video', () => {
    const compiler = require('vue-template-compiler')
    const template = compiler.parseComponent(vue).template.content
    assert.deepEqual(compiler.compile(template).errors, [])
    assert.ok(template.includes('v-if="hasVideo && !useNativeVideo"'))
})
