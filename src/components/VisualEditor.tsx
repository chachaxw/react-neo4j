import { Layout, Modal, message } from 'antd';
import React, { Component, SyntheticEvent } from 'react';
import * as d3 from 'd3';
import './VisualEditor.scss';

import NodeModal from './NodeModal';
import LinkModal from './LinkModal';
import Loading from './Loading';
import { sortBy } from '../utils/utils';
import { ApiService } from '../services/ApiService';
import TopTools from './TopTools';

const { confirm } = Modal;
const { Content } = Layout;

interface Node {
	id?: number | string;
	name: string;
}

interface Link {
	id?: number | string;
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
      this.initSimulation(el!, nodes, this.formatLinks(links));
    });
  }

	initSimulation(el: any, nodes: any[], links: any[]) {

		if (!el) {
			return;
		}

		const width = el.clientWidth;
		const height = el.clientHeight;

		this.simulation = d3.forceSimulation(nodes)
			.force("link", d3.forceLink(links).distance(160).id((d: any) => d.id))
			.force("charge", d3.forceManyBody().distanceMax(300).strength(-800))
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

  restartSimulation(e: SyntheticEvent) {
    e.stopPropagation();

    if (!this.simulation) {
      return;
    }

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
      const { transform } = d3.event;
      const scale = Number((transform.k * 100).toFixed());

      if (scale <= 12.5 || scale >= 500) {
        return;
      }

      this.setState({ scale });
			d3.selectAll('#Neo4jContainer > svg > g').attr('transform', transform);
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

  drawLink() {
    console.log('Draw Link');
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
			.attr('fill', '#6ce4d8');

		node.append('text')
			.attr('dy', '5')
			.attr('fill', '#ffffff')
			.attr('pointer-events', 'none')
			.attr('font-size', '11px')
			.attr('text-anchor', 'middle')
			.text((d: any) => {
					if(d.name && d.name.length > 4){
							return d.name.slice(0, 4) + '...';
					}
					return d.name ? d.name : '';
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
				.attr('stroke', '#6ce4d8')
				.attr('stroke-width', '12')
				.attr('stroke-opacity', '0.5');
		});

		node.on('mouseleave', function() {
			const node: any = d3.select(this);

			if (node._groups[0][0].classList.contains('selected')) {
				return;
			}

      node.select('circle')
        .attr('stroke-width', 0);
		});

		node.on('click', function(d: any) {
			const node: any = d3.select(this);
      const circle = node.select('circle');

      const selected = d3.selectAll('.node.selected')
      self.removeButtonGroup(selected);

			if (node._groups[0][0].classList.contains('selected')) {
				circle.attr('stroke-width', 0);
				node.attr('class', 'node');
				self.removeButtonGroup(node);
			} else {
				circle.attr('stroke-width', 12)
					.attr('stroke', '#6ce4d8');
				node.attr('class', 'node selected');
				self.addButtonGroup(node);
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
      .attr('markerWidth', '14')
      .attr('markerHeight', '14')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', '30')
      .attr('refY', '0')
      .attr('orient', 'auto');
    const arrowPath = 'M0,-4 L10,0 L0,4';

		arrow.append('path').attr('d', arrowPath).attr('fill', '#A5ABB6');
	}

	addButtonGroup(node: any) {
		const data = [1, 1, 1, 1, 1];
		const buttonGroup = node.append('g')
			.attr('id', 'buttonGroup');

		const pieData = d3.pie()(data);
		const arcButton = d3.arc().innerRadius(32).outerRadius(64);
		const arcText = d3.arc().innerRadius(32).outerRadius(60);

		buttonGroup.selectAll('.button')
			.data(pieData)
			.enter()
			.append('path')
			.attr('class', (d: any, i: number) => `button action-${i}`)
			.attr('d', (d: any) => arcButton(d))
			.attr('fill', '#D2D5D9')
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
				button.attr('fill', '#CACACA');
			})
			.on('mouseleave', function() {
				const button: any = d3.select(this);
				button.attr('fill', '#D2D5D9');
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
        this.showAddNode();
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

	removeButtonGroup(node: any) {
		node.select('#buttonGroup').remove();
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
	}

	// Add new link
	showAddLink() {
		this.setState({ showAddLinkModal: true });
	}

	handleAddLinkOk() {
    const { newLink } = this.state;
    console.log(newLink);
  }

  // Add link
  async addLink(source: number | string, target: number | string, relative: string) {
    try {
      const link = {
        source,
        target,
        relative,
      };
      const { data } = await ApiService.postLink(link);
      const links = this.state.links.concat([data]);

      this.setState({ links: this.formatLinks(links) }, () => this.updateSimulation());
      this.handleAddLinkCancel(false);
      message.success('Add Link Success');
    } catch(err) {
      message.error(err.message);
    }
  }

	handleAddLinkChange(value: any) {
		this.setState({
			newLink: {
				...this.state.newLink,
				relative: value,
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

	showAddNode() {
		this.setState({ showAddNodeModal: true });
	}

  // Add node
	async handleAddNodeOk() {
    const { nodes, newNode } = this.state;

    try {
      const { data } = await ApiService.postNode({ name: newNode.name });

      this.setState({ nodes: nodes.concat([data]) }, () => this.updateSimulation());
      this.handleAddNodeCancel(false);
      message.success('Add Node Success');
    } catch(err) {
      message.error(err.message);
    }
	}

	handleAddNodeChange(value: any) {
		this.setState({
			newNode: { name: value },
		});
	}

	handleAddNodeCancel(visible: boolean) {
		this.setState({ showAddNodeModal: visible });
	}

  // Update nodes list
	async handleNodeOk() {
    const { selectedNode } = this.state;

    try {
      await ApiService.patchNode(selectedNode.id, { name: selectedNode.name });

      const nodes = this.state.nodes.map((item) => {
        if(item.id === selectedNode.id) {
          return selectedNode;
        }
        return item;
      });

      this.setState({ nodes }, () => this.updateSimulation());
      this.handleNodeCancel(false);
      message.success('Update Node Success');
    } catch(err) {
      message.error(err.message);
    }
	}

	handleNodeChange(value: any) {
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

	// Update links list
	async handleLinkOk() {
    const { selectedLink } = this.state;

    try {
      const { id, value, source, target, relative } = selectedLink;
      const params = {
        id,
        value,
        source: source.id,
        target: target.id,
        relative,
      };

      await ApiService.patchLink(id, params);

      const links = this.state.links.map((item) => {
          if(item.id === selectedLink.id) {
              return selectedLink;
          }
          return item;
      });

      this.setState({ links }, () => this.updateSimulation());
      this.handleLinkCancel(false);
      message.success('Update Link Success');
    } catch(err) {
      message.error(err.message);
    }
	}

	handleLinkChange(value: any) {
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

  async removeNode(node: any) {
    const { nodes, links  } = this.state;

    try {
      const removedNodes = nodes.filter(d => d.id === node.id);
      const removedLinks = links.filter(d => (d.source.id === node.id || d.target.id === node.id));

      await Promise.all(removedNodes.map(async (d: any) => await ApiService.deleteNode(d.id)));
      await Promise.all(removedLinks.map(async (d: any) => await ApiService.deleteLink(d.id)));

      this.setState({
        nodes: nodes.filter(d => d.id !== node.id),
        links: links.filter(d => (d.source.id !== node.id && d.target.id !== node.id)),
      }, () => this.updateSimulation());
      message.success('Remove Node Success');
    } catch(err) {
      message.error(err.message);
    }
	}

	render() {
		const { showAddNodeModal, showNodeModal, showLinkModal, showAddLinkModal,
			newNode, selectedNode, selectedLink, scale } = this.state;

		if (this.state.loading) {
			return <Loading />;
		}

		return (
			<Content className="visual-editor">
        <TopTools
          scale={scale}
          showAddNode={() => this.showAddNode()}
          />
        <div
          id="Neo4jContainer"
          className="visual-editor-container"
          onClick={(e: SyntheticEvent) => this.restartSimulation(e)}>
        </div>
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
