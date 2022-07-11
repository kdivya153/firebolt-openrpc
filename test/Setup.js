/*
* Copyright 2021 Comcast Cable Communications Management, LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*
* SPDX-License-Identifier: Apache-2.0
*/

/**
 * This module sets up the mock transport layer immediately, instead of letting the SDK wait 500ms
 */

const win = globalThis || window

if (!win.__firebolt) {
    win.__firebolt = {}
}

// wires up the mock transport w/out waiting
win.__firebolt.mockTransportLayer = true

// sets a flag that mock defaults impls can use to speed things up, e.g. Lifecycle/defaults.js
win.__firebolt.automation = true

export const sent = []

console.log('Setup.js')

export const testHarness = {
    initialize: function(config) {
        this.emit = config.emit
    },
    onSend: function(module, method, params, id) {
        const msg = {
            module,
            method,
            params,
            id
        }
        console.log(msg)
        sent.push(msg)
    }
}

win.__firebolt.testHarness = testHarness

export default testHarness