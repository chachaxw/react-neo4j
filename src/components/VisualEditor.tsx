import React, { Component } from 'react';
import * as d3 from 'd3';
import './VisualEditor.css';

import NodeModal from './NodeModal';
import LinkModal from './LinkModal';
import { nodes, links } from '../mock/';
import { sortBy } from '../utils/utils';

interface InternalState {
	showAddModal: boolean;
	showNodeModal: boolean;
	showLinkModal: boolean;
	selectedNode: any;
	selectedLink: any;
	nodes: any[];
	links: any[];
}

class VisualEditor extends Component<any, InternalState> {
	simulation: any = null;

	constructor(props: any) {
		super(props);

		this.state = {
			showAddModal: false,
			showNodeModal: false,
			showLinkModal: false,
			selectedNode: {},
			selectedLink: {},
			nodes: nodes,
			links: links,
		}
	}

	componentDidMount() {
		const { nodes, links } = this.state;
		const el = document.getElementById('Neo4jContainer');

		if (!el) {
			return;
		}

		this.initSimulation(el, nodes, this.formatLinks(links));
	}

	initSimulation(el: any, nodes: any, links: any) {
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
		link.selectAll('.outline')
			.attr('d', (d: any) => this.linkArc(d));

		link.selectAll('.overlay')
			.attr('d', (d: any) => this.linkArc(d));

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
			return;
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

		if(!link && !link.enter()) {
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
			.attr('font-size', '11px')
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
			.attr('fill', '#FB95AF')
			.attr('stroke', '#E0849B')
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
				.attr('stroke', '#FB95AF')
				.attr('stroke-width', '12')
				.attr('stroke-opacity', '0.5');
		});

		node.on('mouseleave', function() {
			const node: any = d3.select(this);

			if (node._groups[0][0].classList.contains('selected')) {
				return;
			}

			node.select('circle')
				.attr('stroke', '#E0849B')
				.attr('stroke-width', '2')
				.attr('stroke-opacity', '1');
		});

		node.on('click', function(d: any) {
			const node: any = d3.select(this);
			const circle = node.select('circle');

			if (node._groups[0][0].classList.contains('selected')) {
				circle.attr('stroke-width', '2')
					.attr('stroke', '#E0849B');
				node.attr('class', 'node');
			} else {
				circle.attr('stroke-width', '12')
					.attr('stroke', '#FB95AF');
				node.attr('class', 'node selected');
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
			.attr('markerWidth', '18')
			.attr('markerHeight', '18')
			.attr('viewBox', '0 0 12 12')
			.attr('refX', '28')
			.attr('refY', '6')
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
			.attr('stroke', '#f2f2f2')
			.attr('stroke-width', 2)
			.attr('stroke-opacity', 0.7);

		buttonGroup.selectAll('.text')
			.data(pieData)
			.enter()
			.append('text')
			.attr('class', 'text')
			.attr('transform', (d: any) => `translate(${arcText.centroid(d)})`)
			.attr('text-anchor', 'middle')
			.attr('fill', '#A5ABB6')
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
		buttonGroup.select('.button.action-0')
			.on('click', (d) => {
				console.log('Edit', d);
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
				console.log('Delete', d);
			});
	}

	removeButtonGroup() {
		d3.select('#buttonGroup').remove();
	}

	updateSimulation(nodes: any[], links: any[]) {
		console.log('Update nodes', nodes, links);
	}

	addNewNode() {
		this.setState({ showNodeModal: true });
	}

	handleNodeOk() {
		console.log('Ok');
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

	handleLinkOk() {
		console.log('Ok');
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
		const { showNodeModal, showLinkModal, selectedNode, selectedLink } = this.state;

		return (
			<div className="visual-editor">
				{/* <div className="visual-editor-tools">
						<Button onClick={() => this.addNewNode()} size="large"
								shape="circle" icon="plus-circle"></Button>
				</div> */}
				<div className="visual-editor-container" id="Neo4jContainer"></div>
				<NodeModal
					visible={showNodeModal}
					name={selectedNode.name}
					onOk={() => this.handleNodeOk()}
					onChange={(e) => this.handleNodeChange(e)}
					onCancel={(visible: boolean) => this.handleNodeCancel(visible)}
				/>
				<LinkModal
					visible={showLinkModal}
					name={selectedLink.relative}
					onOk={() => this.handleLinkOk()}
					onChange={(e) => this.handleLinkChange(e)}
					onCancel={(visible: boolean) => this.handleLinkCancel(visible)}
				/>
			</div>
		);
	}
}

export default VisualEditor;
