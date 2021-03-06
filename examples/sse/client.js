const choo = require('../../')
const html = require('../../html')

const app = choo()
app.model(createModel())
app.router(['/', mainView])

const tree = app.start()
document.body.appendChild(tree)

function mainView (state, prev, send) {
  return html`
    <div>${state.logger.msg}</div>
  `
}

function createModel () {
  const stream = new window.EventSource('/sse')
  return {
    namespace: 'logger',
    state: {
      msg: ''
    },
    subscriptions: [
      function (send, done) {
        stream.onerror = (e) => {
          send('logger:error', { payload: JSON.stringify(e) }, done)
        }
        stream.onmessage = (e) => {
          const msg = JSON.parse(e.data).message
          send('logger:print', { payload: msg }, done)
        }
      }
    ],
    reducers: {
      'print': (state, data) => {
        return ({ msg: state.msg + ' ' + data.payload })
      }
    },
    effects: {
      close: (state, data, send, done) => {
        stream.close()
        done()
      },
      error: (state, data, send, done) => {
        console.error(`error: ${data.payload}`)
        done()
      }
    }
  }
}
