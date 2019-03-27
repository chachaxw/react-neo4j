import { Button, Layout, Modal, Row, Tooltip, Spin, Icon } from 'antd';
import React, { Component } from 'react';
import * as d3 from 'd3';
import './VisualEditor.css';

import NodeModal from './NodeModal';
import LinkModal from './LinkModal';
import Loading from './Loading';
import { sortBy } from '../utils/utils';
import { ApiService } from '../services/ApiService';

const { confirm } = Modal;
const { Content } = Layout;

interface Node {
	id: number | string;
	name: string;
}

interface Link {
	id: number | string;
	source: number | string | object | null;
	target: number | string | object | null;
	relative: string;
}

interface InternalState {
	loading: boolean;
	showAddLinkModal: boolean;
	showAddNodeModal: boolean;
	showNodeModal: boolean;
	showLinkModal: boolean;
	selectedNode: any;
	selectedLink: any;
	selectedNodes: any[];
	newNode: Node;
	newLink: Link;
	nodes: any[];
	links: any[];
	scale: number;
}

class VisualEditor extends Component<any, InternalState> {
	simulation: any = null;

	constructor(props: any) {
		super(props);

		this.state = {
			loading: true,
			showAddLinkModal: false,
			showAddNodeModal: false,
			showNodeModal: false,
			showLinkModal: false,
			selectedNode: {},
			selectedNodes: [],
			selectedLink: {},
			newNode: {
				id: 0,
				name: '',
			},
			newLink: {
				id: 0,
				source: null,
				target: null,
				relative: 'LINK_TO',
			},
			nodes: [],
			links: [],
			scale: 100,
		}
	}

	async componentDidMount() {
		const {data: nodes} = await ApiService.fetchNodes();
		const {data: links} = await ApiService.fetchLinks();

		this.setState({	loading: false, nodes, links }, () => {
			const el = document.getElementById('Neo4jContainer');
			this.initSimulation(el, nodes, this.formatLinks(links));
		});
	}

	initSimulation(el: any, nodes: any[], links: any[]) {

		if (!el) {
			return;
		}

		const width = el.clientWidth;
		const height = el.clientHeight;

		this.simulation = d3.forceSimulation(nodes)
			.force("link", d3.forceLink(links).distance(180).id((d: any) => d.id))
			.force("charge", d3.forceManyBody().strength(-800))
			.force("collide", d3.forceCollide().strength(-60))
			.force("center", d3.forceCenter(width / 2, height / 2));

		const svg = d3.select('#Neo4jContainer')
			.append("svg")
			.attr("width", '100%')
			.attr("height", '100%');

		this.onZoom(svg);
		this.addArrowMarker(svg);

		const link = this.initLinks(links, svg);
		const node = this.initNodes(nodes, svg);

		this.simulation.on('tick', () => this.handleTick(link, node));
		this.simulation.alpha(1).restart();
	}

	handleTick(link: any, node: any) {
		if (link) {
			link.selectAll('.outline')
			.attr('d', (d: any) => this.linkArc(d));

			link.selectAll('.overlay')
				.attr('d', (d: any) => this.linkArc(d));
		}

		node.attr('transform', (d: any) => `translate(${d.x}, ${d.y})`);
}

	onDragStarted(d: any) {
		if (!d3.event.active) {
			this.simulation.alphaTarget(0.3).restart();
		}
		d.fx = d.x;
		d.fy = d.y;
	}

	onDragged(d: any) {
		d.fx = d3.event.x;
		d.fy = d3.event.y;
	}

	onDragEnded(d: any) {
		if (!d3.event.active) {
			this.simulation.alphaTarget(0);
		}
	}

	onZoom(svg: any) {
		// 鼠标滚轮缩放
		svg.call(d3.zoom().on('zoom', () => {
			d3.selectAll('#Neo4jContainer > svg > g').attr('transform', d3.event.transform);
		}));
		svg.on('dblclick.zoom', null); // 静止双击缩放
	}

	formatLinks(links: any[]) {
		if (!links || !(links && links.length > 0)) {
			return [];
		}

		links.forEach((link: any) => {
			const same = links.filter(d => d.source === link.target && d.target === link.source);
			const sameSelf = links.filter(d => d.source === link.source && d.target === link.target);
			const all = sameSelf.concat(same);

			all.forEach((item: any, index: number) => {
				item.sameIndex = index + 1;
				item.sameTotal = all.length;
				item.sameTotalHalf = item.sameTotal / 2;
				item.sameUneven = (item.sameTotal % 2) !== 0;
				item.sameMiddleLink = (item.sameUneven === true) && (Math.ceil(item.sameTotalHalf) === item.sameIndex);
				item.sameLowerHalf = item.sameIndex <= item.sameTotalHalf;
				item.sameArcDirection = 1;
				item.sameIndexCorrected = item.sameLowerHalf ? item.sameIndex : (item.sameIndex - Math.ceil(item.sameTotalHalf));
			});
		});

		const maxSame = links.concat().sort(sortBy('sameTotal')).slice(-1)[0].sameTotal;

		links.forEach(link => {
			link.maxSameHalf = Math.round(maxSame / 2);
		});

		return links;
	}

	initLinks(links: any, svg: any) {
		const link = svg.append('g')
			.attr('class', 'layer links')
			.selectAll('path.outline')
			.data(links, (d: any) => d)

		return this.createLink(link);
	}

createLink(link: any) {

		if(!link || (link && !link._enter)) {
				return;
		}

		link = link.enter()
			.append('g')
			.attr('class', 'link');

		link.append('path')
			.attr('id', (d: any, i: number) => `linkPath${i}`)
			.attr('class', 'outline')
			.attr('stroke', '#A5ABB6')
			.attr('fill', 'none')
			.attr('stroke-width', 1)
			.attr('marker-end', 'url(#ArrowMarker)');

		link.append('text')
			.attr("class", 'link-text')
			.attr('fill', '#A5ABB6')
			.append('textPath')
			.attr('pointer-events', 'none')
			.attr('href', (d: any, i: number) => `#linkPath${i}`)
			.attr('startOffset', '50%')
			.attr('font-size', 12)
			.attr('text-anchor', 'middle')
			.text((d: any) => {
					if(d.relative !== ''){
							return d.relative;
					}
			});

		link.append('path')
			.attr('class', 'overlay')
			.attr('fill', 'none')
			.attr('stroke-opacity', '0.5')
			.attr('stroke-width', '16')
			.style('opacity', '0');

		// init link event
		this.initLinkEvent(link);

		return link;
	}

	initLinkEvent(link: any) {
		const self = this;

		link.on('mouseenter', function() {
			const link: any = d3.select(this);

			if (!link._groups[0][0].classList.contains('selected')) {
				link.select('.overlay')
					.attr('stroke', '#68bdf6')
					.style('opacity', 1);
			}
		});

		link.on('mouseleave', function() {
			const link: any = d3.select(this);

			if (!link._groups[0][0].classList.contains('selected')) {
				link.select('.overlay')
					.style('opacity', 0);
			}
		});

		link.on('click', function(d: any) {
			const link: any = d3.select(this);

			if (link._groups[0][0].classList.contains('selected')) {
				link.attr('class', 'link');
				link.select('.overlay')
					.style('opacity', 0);
			} else {
				link.attr('class', 'link selected');
				link.select('.overlay')
					.attr('stroke', '#FDCC59')
					.style('opacity', 1);
			}

			self.setState({ selectedLink: d });
		});

		link.on('dblclick', function() {
			self.setState({ showLinkModal: true });
		});
	}

	linkArc(d: any) {
		const dx = (d.target.x - d.source.x);
		const dy = (d.target.y - d.source.y);
		const dr = Math.sqrt(dx * dx + dy * dy);
		const unevenCorrection = d.sameUneven ? 0 : 0.5;
		const curvature = 2;
		let arc = (1.0 / curvature) * ((dr * d.maxSameHalf) / (d.sameIndexCorrected - unevenCorrection));

		if (d.sameMiddleLink) {
			arc = 0;
		}

		return `M${d.source.x},${d.source.y}A${arc},${arc} 0 0,${d.sameArcDirection} ${d.target.x},${d.target.y}`;
	}

	initNodes(nodes: any, svg: any) {
		const node = svg.append('g')
			.attr('class', 'layer nodes')
			.selectAll('.node')
			.data(nodes, (d: any) => d);

		return this.createNode(node);
	}

	createNode(node: any) {
		node = node.enter()
			.append('g')
			.attr('class', 'node')
			.call(d3.drag()
				.on("start", (d) => this.onDragStarted(d))
				.on("drag", (d) => this.onDragged(d))
				.on("end", (d) => this.onDragEnded(d))
			);

		node.append('circle')
			.attr("r", 30)
			.attr('fill', '#0099cc')
			.attr('stroke', '#237dac')
			.attr('stroke-width', '2')

		node.append('text')
			.attr('dy', '5')
			.attr('fill', '#ffffff')
			.attr('pointer-events', 'none')
			.attr('font-size', '11px')
			.attr('text-anchor', 'middle')
			.text((d: any) => {
					if(d.name.length > 4){
							const name = d.name.slice(0, 4) + '...';
							return name;
					}
					return d.name;
			});

		node.append("title").text((d: any) => d.name);

		// init node event
		this.initNodeEvent(node);

		return node;
	}

	initNodeEvent(node: any) {
		const self = this;

		node.on('mouseenter', function() {
			const node: any = d3.select(this);

			if (node._groups[0][0].classList.contains('selected')) {
				return;
			}

			node.select('circle')
				.attr('stroke', '#0099cc')
				.attr('stroke-width', '12')
				.attr('stroke-opacity', '0.5');
		});

		node.on('mouseleave', function() {
			const node: any = d3.select(this);

			if (node._groups[0][0].classList.contains('selected')) {
				return;
			}

			node.select('circle')
				.attr('stroke', '#237dac')
				.attr('stroke-width', '2')
				.attr('stroke-opacity', '1');
		});

		node.on('click', function(d: any) {
			const node: any = d3.select(this);
			const circle = node.select('circle');

			if (node._groups[0][0].classList.contains('selected')) {
				circle.attr('stroke-width', '2')
					.attr('stroke', '#237dac');
				node.attr('class', 'node');
				self.removeButtonGroup();
			} else {
				circle.attr('stroke-width', '12')
					.attr('stroke', '#0099cc');
				node.attr('class', 'node selected');
				self.initButtonGroup();
			}

			self.setState({ selectedNode: d });
		});

		node.on('dblclick', function() {
			self.setState({ showNodeModal: true });
		});
	}

	addArrowMarker(svg: any) {
		const arrow = svg.append('marker')
			.attr('id', 'ArrowMarker')
			.attr('markerUnits', 'strokeWidth')
			.attr('markerWidth', 18)
			.attr('markerHeight', 18)
			.attr('viewBox', '0 0 12 12')
			.attr('refX', 30)
			.attr('refY', 6)
			.attr('orient', 'auto');

		const arrowPath = 'M2,2 L10,6 L2,10 L6,6 L2,2';
		arrow.append('path').attr('d', arrowPath).attr('fill', '#A5ABB6');
	}

	initButtonGroup() {
		const data = [1, 1, 1, 1, 1];
		const buttonGroup = d3.select('.node.selected').append('g')
			.attr('id', 'buttonGroup');
		
		const pieData = d3.pie()(data);
		const arcButton = d3.arc().innerRadius(32).outerRadius(64);
		const arcText = d3.arc().innerRadius(32).outerRadius(60);

		buttonGroup.selectAll('.button')
			.data(pieData)
			.enter()
			.append('path')
			.attr('class', (d, i) => `button action-${i}`)
			.attr('d', (d: any) => arcButton(d))
			.attr('fill', '#D2D5DA')
			.style('cursor', 'pointer')
			.attr('stroke', '#f1f4f9')
			.attr('stroke-width', 2)
			.attr('stroke-opacity', 0.7);

		buttonGroup.selectAll('.text')
			.data(pieData)
			.enter()
			.append('text')
			.attr('class', 'text')
			.attr('transform', (d: any) => `translate(${arcText.centroid(d)})`)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fff')
			.attr('pointer-events', 'none')
			.attr('font-size', 11)
			.text(function(d: any, i: number) {
				const actions = ['编辑', '展开', '追加', '连线', '删除'];
				return actions[i];
			});

		this.initButtonActions();

		return buttonGroup;
	}

	initButtonActions() {
		const buttonGroup = d3.select('#buttonGroup');

		buttonGroup.selectAll('.button')
			.on('mouseenter', function() {
				const button: any = d3.select(this);
				button.attr('fill', '#0099cc');
			})
			.on('mouseleave', function() {
				const button: any = d3.select(this);
				button.attr('fill', '#D2D5DA');
			})

		buttonGroup.select('.button.action-0')
			.on('click', (d) => {
				this.setState({
					selectedNode: d,
					showNodeModal: true,
				});
			});

		buttonGroup.select('.button.action-1')
			.on('click', (d) => {
				console.log('Expand', d);
			});

		buttonGroup.select('.button.action-2')
			.on('click', (d) => {
				console.log('Add', d);
			});

		buttonGroup.select('.button.action-3')
			.on('click', (d) => {
				console.log('Link', d);
			});

		buttonGroup.select('.button.action-4')
			.on('click', (d) => {
				confirm({
					title: '确定删除该节点？',
					onOk: () => {
							this.removeNode(d);
					},
				});
			});
	}

	removeButtonGroup() {
		d3.select('#buttonGroup').remove();
	}

	updateSimulation() {
		const { links, nodes } = this.state;

		// Update node
		let node = d3.select('.nodes')
			.selectAll('.node')
			.data(nodes, d => d);
		node.exit().remove();
		const nodeEnter = this.createNode(node);
		node = nodeEnter.merge(node);

		// Update link
		let link = d3.select('.links')
			.selectAll('.link')
			.data(links, d => d);
		link.exit().remove();
		const linkEnter = this.createLink(link);
		link = linkEnter.merge(link);

		this.simulation.nodes(nodes)
			.on('tick', () => this.handleTick(link, node));
		this.simulation.force('link').links(links);
		this.simulation.alpha(1).restart();
		this.clearSelectedNodes();
	}

	removeNode(node: any) {
		const nodes = this.state.nodes.filter(d => d.id !== node.id);
		const links = this.state.links.filter(d => (d.source.id !== node.id && d.target.id !== node.id));
		this.setState({ nodes, links }, () => {
			this.updateSimulation();
		});
	}

	// Add new link
	addNewLink() {
		this.setState({ showAddLinkModal: true });
	}

	handleAddLinkOk() {
		const { selectedNodes, newLink } = this.state;

		if (!selectedNodes.length) {
			return;
		}

		const link = {
			source: selectedNodes[0],
			target: selectedNodes[1],
			relative: 'LINK_TO',
		};
		const links = this.state.links.concat([link]);
		this.setState({ links: this.formatLinks(links) }, () => {
			this.updateSimulation();
		});
	}

	handleAddLinkChange(e: any) {
		this.setState({
			newLink: {
				...this.state.newLink,
				relative: e.target.value,
			}
		});
	}

	handleAddLinkCancel(visible: boolean) {
		this.setState({
			showAddLinkModal: visible,
			newLink: {
				id: 0,
				source: null,
				target: null,
				relative: ''
			},
		});
	}

	clearSelectedNodes() {
		d3.selectAll('.node.selected')
				.attr('class', 'node');
		this.setState({ selectedNodes: [] });
	}

	addNewNode() {
		this.setState({ showAddNodeModal: true });
	}

	handleAddNodeOk() {
		const { nodes, newNode } = this.state;
		this.setState({ nodes: nodes.concat([newNode]) }, async () => {
			await ApiService.postNode({ name: newNode.name });
			this.updateSimulation();
		});
		this.handleAddNodeCancel(false);
	}

	handleAddNodeChange(e: any) {
		this.setState({
			newNode: {
				id: this.state.nodes.length,
				name: e.target.value,
				x: 200,
				y: 200,
				fx: 50,
				fy: 50,
			},
		});
	}

	handleAddNodeCancel(visible: boolean) {
		this.setState({ showAddNodeModal: visible });
	}

	handleNodeOk() {
		const { selectedNode } = this.state;
		const nodes = this.state.nodes.map((item) => {
			if(item.id === selectedNode.id) {
				return selectedNode;
			}
			return item;
		});

		// Update node
		this.setState({ nodes }, async () => {
			await ApiService.patchNode(selectedNode.id, { name: selectedNode.name });
			this.updateSimulation();
		});
		this.handleNodeCancel(false);
	}

	handleNodeChange(e: any) {
		const value = e.target.value;
		const { selectedNode } = this.state;
		this.setState({
			selectedNode: {
				...selectedNode,
				name: value,
			},
		});
	}

	handleNodeCancel(visible: boolean) {
		this.setState({ showNodeModal: visible });
	}

	// Update link
	handleLinkOk() {
		const { selectedLink } = this.state;
		const links = this.state.links.map((item) => {
				if(item.id === selectedLink.id) {
						return selectedLink;
				}
				return item;
		});

		this.setState({ links }, async () => {
			const { id, value, source, target, relative } = selectedLink;
			const params = { id, value, source, target, relative };
			await ApiService.patchLink(id, params);
			this.updateSimulation();
		});
		this.handleLinkCancel(false);
	}

	handleLinkChange(e: any) {
		const value = e.target.value;
		const { selectedLink } = this.state;
		this.setState({
			selectedLink: {
				...selectedLink,
				relative: value,
			},
		});
	}

	handleLinkCancel(visible: boolean) {
		this.setState({ showLinkModal: visible });
	}
	
	render() {
		const { showAddNodeModal, showNodeModal, showLinkModal, showAddLinkModal,
			newNode, selectedNode, selectedLink, scale } = this.state;

		if (this.state.loading) {
			return <Loading />;
		}

		return (
			<Content className="visual-editor">
				<div className="visual-editor-tools">
					<Tooltip title="Add Node" placement="right">
						<Button onClick={() => this.addNewNode()} size="large"
							shape="circle" icon="plus" type="primary">
						</Button>
					</Tooltip>
				</div>
				<div className="visual-editor-container" id="Neo4jContainer"></div>
				<NodeModal
					title="添加节点"
					visible={showAddNodeModal}
					name={newNode.name}
					onOk={() => this.handleAddNodeOk()}
					onChange={(e) => this.handleAddNodeChange(e)}
					onCancel={(visible: boolean) => this.handleAddNodeCancel(visible)}
				/>
				<NodeModal
					title="编辑节点"
					visible={showNodeModal}
					name={selectedNode.name}
					onOk={() => this.handleNodeOk()}
					onChange={(e) => this.handleNodeChange(e)}
					onCancel={(visible: boolean) => this.handleNodeCancel(visible)}
				/>
				<LinkModal
					title="添加节点关系"
					visible={showAddLinkModal}
					name={selectedLink.relative}
					onOk={() => this.handleAddLinkOk()}
					onChange={(e: any) => this.handleAddLinkChange(e)}
					onCancel={(visible: boolean) => this.handleAddLinkCancel(visible)}
				/>
				<LinkModal
					title="编辑节点关系"
					visible={showLinkModal}
					name={selectedLink.relative}
					onOk={() => this.handleLinkOk()}
					onChange={(e) => this.handleLinkChange(e)}
					onCancel={(visible: boolean) => this.handleLinkCancel(visible)}
				/>
			</Content>
		);
	}
}

export default VisualEditor;
