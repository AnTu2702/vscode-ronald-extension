// @ts-check

// Script run within the webview itself.
(function () {

	// Get a reference to the VS Code webview api.
	// We use this API to post messages back to our extension.

	// @ts-ignore
	const vscode = acquireVsCodeApi();

	const ronaldContainer = /** @type {HTMLElement} */ (document.querySelector('.ronald'));
	const errorContainer = document.createElement('div');

	document.body.appendChild(errorContainer);
	
	errorContainer.className = 'error'
	errorContainer.style.display = 'none'

	/**
	 * Append a port table cell.
	 */
	function appendTableCell(/** @type {HTMLTableRowElement} */ row, /** @type {string} */ text) {

		const td = document.createElement('td');
		row.appendChild(td);
		td.innerHTML = text;
	}

	/**
	 * Append a vlan table.
	 */
	function appendVlanTable(/** @type {HTMLTableElement} */ table, /** @type {any} */ json) {

		const thead = document.createElement('thead');
		table.appendChild(thead);

		const thr = document.createElement('tr');
		thead.appendChild(thr);

		thr.innerHTML = ' \
			<th scope="col">VlanId</th> \
			<th scope="col">Name</th> \
			<th scope="col">Priority</th> \
			<th scope="col">StaticIp</th> \
			<th scope="col">IsDhcpClient</th> \
			<th scope="col">IsDhcpServer</th> \
			<th scope="col">DhcpDenyPorts</th> \
			<th scope="col">DhcpPool</th> \
			<th scope="col">DhcpLower</th> \
			<th scope="col">DhcpUpper</th> \
			<th scope="col">DhcpLease</th>';

		const tbody = document.createElement('tbody');
		table.appendChild(tbody);

		for (const vlan of json.vlans || []) {

			const tr = document.createElement('tr');
			tbody.appendChild(tr);

			appendTableCell(tr, vlan.id);
			appendTableCell(tr, vlan.name);
			appendTableCell(tr, vlan.priority);
			appendTableCell(tr, vlan.hostIp ? String(vlan.hostIp).replace("{{ config.IP_CONFIG.VLAN",'&lt;').replace('_ADDR }}','&gt;') + '' : '-');

			appendTableCell(tr, vlan.dhcpClient ? 'Yes' : 'No');
			appendTableCell(tr, vlan.dhcpServer ? 'Yes' : 'No');

			if (vlan.dhcpPool && vlan.dhcpPool.name && vlan.dhcpServer) {
				appendTableCell(tr, String(vlan.dhcpIgnoredPorts).replace(' ',''));
				appendTableCell(tr, vlan.dhcpPool.name);
				appendTableCell(tr, vlan.dhcpPool.lower ? String(vlan.dhcpPool.lower).replace('{{ config.IP_CONFIG.VLAN','&lt;').replace('_ADDR }}','&gt;') +'' : '');
				appendTableCell(tr, vlan.dhcpPool.upper ? String(vlan.dhcpPool.upper).replace('{{ config.IP_CONFIG.VLAN','&lt;').replace('_ADDR }}','&gt;') +'' : '');
				appendTableCell(tr, vlan.dhcpPool.leasetime);
			}
			else {
				appendTableCell(tr, '-');
				appendTableCell(tr, '-');
				appendTableCell(tr, '-');
				appendTableCell(tr, '-');
				appendTableCell(tr, '-');
			}
		}
	}

	/**
	 * Append a port table.
	 */
	function appendPortTable(/** @type {HTMLTableElement} */ table, /** @type {any} */ json) {

		const thead = document.createElement('thead');
		table.appendChild(thead);

		const thr = document.createElement('tr');
		thead.appendChild(thr);

		thr.innerHTML = ' \
			<th scope="col">Port</th> \
			<th scope="col">PoE</th> \
			<th scope="col">Type</th> \
			<th scope="col">AppId</th> \
			<th scope="col">SubId</th> \
			<th scope="col">DeviceId</th> \
			<th scope="col">Location</th> \
			<th scope="col">VlanId</th> \
			<th scope="col">Usage</th> \
			<th scope="col">Disabled</th> \
			<th scope="col">Speed</th> \
			<th scope="col">STP</th> \
			<th scope="col">ClientId</th>';

		const tbody = document.createElement('tbody');
		table.appendChild(tbody);

		const tr = document.createElement('tr');
		tbody.appendChild(tr);

		appendTableCell(tr, 'G');
		appendTableCell(tr, '-');
		appendTableCell(tr, 'K');
		appendTableCell(tr, '0');
		appendTableCell(tr, '0');
		appendTableCell(tr, 'X');
		appendTableCell(tr, json.common.location);
		appendTableCell(tr, 'X');
		appendTableCell(tr, 'Switch - Config Version: ' + json.common.configVersion);
		appendTableCell(tr, '-');
		appendTableCell(tr, '-');
		appendTableCell(tr, json.common.stpPriority);
		appendTableCell(tr, '-');

		for (const port of json.ports || []) {

			for (const connection of port.connections || []) {
			
				const tr = document.createElement('tr');
				tbody.appendChild(tr);

				appendTableCell(tr, port.number);
				appendTableCell(tr, (port.poeEnabled ? 'Yes' : 'No'));
				appendTableCell(tr, port.daisychain ? 'D' : (port.number < 17 ? 'A' : 'T'));
				appendTableCell(tr, connection.applicationId ? connection.applicationId : '-');
				appendTableCell(tr, connection.subId ? connection.subId : '-');
				appendTableCell(tr, connection.deviceId ? connection.deviceId : '-');
				appendTableCell(tr, connection.locationId ? connection.locationId : '-');
				appendTableCell(tr, connection.tagged ? 'T' + '[' + connection.vlanIds.join().replace(' ','') + ']' : ((((connection.vlanIds.length == 1)
						  && ! (port.connections.length > 1)) || port.daisychain) ? 'UT' : 'UT') + '[' + connection.vlanIds.join().replace(' ','') + ']');
				appendTableCell(tr, connection.description);
				appendTableCell(tr, port.disabled ? 'Yes' : 'No');
				appendTableCell(tr, port.speed);
				appendTableCell(tr, port.stpEnabled ? 'Yes' : 'No');
				appendTableCell(tr, port.daisychain ? connection.clientId : '-');
			}
		}
	}

	/**
	 * Render the document in the webview.
	 */
	function updateContent(/** @type {string} */ text) {

		let json;
		try {
			if (!text) {
				text = '{}';
			}
			json = JSON.parse(text);
		} catch {
			ronaldContainer.style.display = 'none';
			errorContainer.innerText = 'Error: Document is not valid json';
			errorContainer.style.display = '';
			return;
		}
		ronaldContainer.style.display = '';
		errorContainer.style.display = 'none';

		ronaldContainer.innerHTML = '';

		const brVlanTable = document.createElement('br');
		ronaldContainer.appendChild(brVlanTable);

 		const vlanTable = document.createElement('table');
		ronaldContainer.appendChild(vlanTable);

		appendVlanTable(vlanTable, json);

		const brPortTable = document.createElement('br');
		ronaldContainer.appendChild(brPortTable);

		const portTable = document.createElement('table');
		ronaldContainer.appendChild(portTable);

		appendPortTable(portTable, json);
	}

	// Handle messages sent from the extension to the webview
	window.addEventListener('message', event => {
		const message = event.data; // The json data that the extension sent
		switch (message.type) {
			case 'update':
				const text = message.text;

				// Update our webview's content
				updateContent(text);

				// Then persist state information.
				// This state is returned in the call to `vscode.getState` below when a webview is reloaded.
				vscode.setState({ text });

				return;
		}
	});

	// Webviews are normally torn down when not visible and re-created when they become visible again.
	// State lets us save information across these re-loads
	const state = vscode.getState();
	if (state) {
		updateContent(state.text);
	}
}());
