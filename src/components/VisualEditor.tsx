import { Layout, message, Modal } from 'antd';
import * as d3 from 'd3';
import React, { Component, SyntheticEvent } from 'react';

import { ApiService } from '../services/ApiService';
import { ColorTheme, sortBy } from '../utils';
import DrawerTools from './DrawerTools';
import LinkModal from './LinkModal';
import Loading from './Loading';
import NodeModal from './NodeModal';
import TopTools from './TopTools';
import { Link, Node } from './types';
import './VisualEditor.scss';

const { confirm } = Modal;
const { Content } = Layout;
const example = process.env.PUBLIC_URL + 'example.png';

interface InternalState {
  loading: boolean;
  showDrawerTools: boolean;
  addNodeLoading: boolean;
  editNodeLoading: boolean;
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
  private simulation: any = null;

  constructor(props: any) {
    super(props);

    this.state = {
      loading: true,
      selectedNode: null,
      selectedLink: null,
      showDrawerTools: false,
      addNodeLoading: false,
      editNodeLoading: false,
      showAddLinkModal: false,
      showAddNodeModal: false,
      showNodeModal: false,
      showLinkModal: false,
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
    };
  }

  public async componentDidMount() {
    const { data: nodes } = await ApiService.fetchNodes();
    const { data: links } = await ApiService.fetchLinks();

    this.setState({ loading: false, nodes, links }, () => {
      const el = document.getElementById('Neo4jContainer');
      this.initSimulation(el!, nodes, this.formatLinks(links));
    });
  }

  public initSimulation(el: any, nodes: any[], links: any[]) {
    if (!el) {
      return;
    }

    const width = el.clientWidth;
    const height = el.clientHeight;

    this.simulation = d3
      .forceSimulation(nodes)
      .force(
        'link',
        d3
          .forceLink(links)
          .distance(160)
          .id((d: any) => d.id)
      )
      .force(
        'charge',
        d3
          .forceManyBody()
          .distanceMax(300)
          .strength(-800)
      )
      .force('collide', d3.forceCollide().strength(-60))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const svg = d3
      .select('#Neo4jContainer')
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%');

    this.onZoom(svg);
    this.addArrowMarker(svg);
    this.initImage(example, svg);

    const link = this.initLinks(links, svg);
    const node = this.initNodes(nodes, svg);

    this.simulation.on('tick', () => this.handleTick(link, node));
    this.simulation.alpha(1).restart();
  }

  public restartSimulation(e: SyntheticEvent) {
    e.stopPropagation();

    if (!this.simulation) {
      return;
    }

    this.simulation.alpha(1).restart();
  }

  public handleTick(link: any, node: any, img?: any) {
    if (link) {
      link.selectAll('.outline').attr('d', (d: any) => this.linkArc(d));

      link.selectAll('.overlay').attr('d', (d: any) => this.linkArc(d));
    }

    node.attr('transform', (d: any) => `translate(${d.x}, ${d.y})`);
  }

  public onDragStarted(d: any) {
    if (!d3.event.active) {
      this.simulation.alphaTarget(0.3).restart();
    }
    d.fx = d.x;
    d.fy = d.y;
  }

  public onDragged(d: any) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  public onDragEnded(d: any) {
    if (!d3.event.active) {
      this.simulation.alphaTarget(0);
    }
  }

  public onZoom(svg: any) {
    // 鼠标滚轮缩放
    svg.call(
      d3.zoom().on('zoom', () => {
        const { transform } = d3.event;
        const scale = Number((transform.k * 100).toFixed());

        if (scale <= 12.5 || scale >= 500) {
          return;
        }

        this.setState({ scale });
        d3.selectAll('#Neo4jContainer > svg > g').attr('transform', transform);
      })
    );
    svg.on('dblclick.zoom', null); // 静止双击缩放
  }

  public formatLinks(links: any[]) {
    if (!links || !(links && links.length > 0)) {
      return [];
    }

    links.forEach((link: any) => {
      const same = links.filter((d) => d.source === link.target && d.target === link.source);
      const sameSelf = links.filter((d) => d.source === link.source && d.target === link.target);
      const all = sameSelf.concat(same);

      all.forEach((item: any, index: number) => {
        item.sameIndex = index + 1;
        item.sameTotal = all.length;
        item.sameTotalHalf = item.sameTotal / 2;
        item.sameUneven = item.sameTotal % 2 !== 0;
        item.sameMiddleLink = item.sameUneven === true && Math.ceil(item.sameTotalHalf) === item.sameIndex;
        item.sameLowerHalf = item.sameIndex <= item.sameTotalHalf;
        item.sameArcDirection = 1;
        item.sameIndexCorrected = item.sameLowerHalf ? item.sameIndex : item.sameIndex - Math.ceil(item.sameTotalHalf);
      });
    });

    const maxSame = links
      .concat()
      .sort(sortBy('sameTotal'))
      .slice(-1)[0].sameTotal;

    links.forEach((link) => {
      link.maxSameHalf = Math.round(maxSame / 2);
    });

    return links;
  }

  public initImage(img: string, svg: any) {
    const el = svg.selectAll('image').data([0]);

    el.enter()
      .append('svg:image')
      .attr('xlink:href', img)
      .attr('height', '100%')
      .attr('x', 0)
      .attr('y', 0);

    return el;
  }

  public initLinks(links: any, svg: any) {
    const link = svg
      .append('g')
      .attr('class', 'layer links')
      .selectAll('path.outline')
      .data(links, (d: any) => d);

    return this.createLink(link);
  }

  public createLink(link: any) {
    if (!link || (link && !link._enter)) {
      return;
    }

    link = link
      .enter()
      .append('g')
      .attr('class', 'link');

    link
      .append('path')
      .attr('id', (d: any, i: number) => `linkPath${i}`)
      .attr('class', 'outline')
      .attr('style', 'cursor: pointer')
      .attr('stroke', '#A5ABB6')
      .attr('fill', 'none')
      .attr('stroke-width', 1)
      .attr('marker-end', 'url(#ArrowMarker)');

    link
      .append('text')
      .attr('class', 'link-text')
      .attr('fill', '#A5ABB6')
      .append('textPath')
      .attr('pointer-events', 'none')
      .attr('href', (d: any, i: number) => `#linkPath${i}`)
      .attr('startOffset', '50%')
      .attr('font-size', 12)
      .attr('text-anchor', 'middle')
      .text((d: any) => {
        if (d.relative !== '') {
          return d.relative;
        }
      });

    link
      .append('path')
      .attr('class', 'overlay')
      .attr('fill', 'none')
      .attr('stroke-opacity', '0.5')
      .attr('stroke-width', '16')
      .style('opacity', '0');

    // init link event
    this.initLinkEvent(link);

    return link;
  }

  public initLinkEvent(link: any) {
    link.on('mouseenter', (d: any, i: number, n: any[]) => {
      const link: any = d3.select(n[i]);

      if (!link._groups[0][0].classList.contains('selected')) {
        link
          .select('.overlay')
          .attr('stroke', '#68bdf6')
          .style('opacity', 1);
      }
    });

    link.on('mouseleave', (d: any, i: number, n: any[]) => {
      const link: any = d3.select(n[i]);

      if (!link._groups[0][0].classList.contains('selected')) {
        link.select('.overlay').style('opacity', 0);
      }
    });

    link.on('click', (d: any, i: number, n: any[]) => {
      const link: any = d3.select(n[i]);

      if (link._groups[0][0].classList.contains('selected')) {
        link.attr('class', 'link');
        link.select('.overlay').style('opacity', 0);
      } else {
        link.attr('class', 'link selected');
        link
          .select('.overlay')
          .attr('stroke', '#FDCC59')
          .style('opacity', 1);
      }

      this.setState({ selectedLink: d });
    });

    link.on('dblclick', () => {
      this.setState({ showLinkModal: true });
    });
  }

  public linkArc(d: any) {
    const dx = d.target.x - d.source.x;
    const dy = d.target.y - d.source.y;
    const dr = Math.sqrt(dx * dx + dy * dy);
    const unevenCorrection = d.sameUneven ? 0 : 0.5;
    const curvature = 2;
    let arc = (1.0 / curvature) * ((dr * d.maxSameHalf) / (d.sameIndexCorrected - unevenCorrection));

    if (d.sameMiddleLink) {
      arc = 0;
    }

    return `M${d.source.x},${d.source.y}A${arc},${arc} 0 0,${d.sameArcDirection} ${d.target.x},${d.target.y}`;
  }

  public drawLink() {
    // console.log('Draw Link');
  }

  public initNodes(nodes: any, svg: any) {
    const node = svg
      .append('g')
      .attr('class', 'layer nodes')
      .selectAll('.node')
      .data(nodes, (d: any) => d);

    return this.createNode(node);
  }

  public createNode(node: any) {
    node = node
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('style', 'cursor: pointer')
      .call(
        d3
          .drag()
          .on('start', (d) => this.onDragStarted(d))
          .on('drag', (d) => this.onDragged(d))
          .on('end', (d) => this.onDragEnded(d))
      );

    node
      .append('circle')
      .attr('r', 30)
      .attr('fill', ColorTheme.Cyan);

    node
      .append('text')
      .attr('dy', '5')
      .attr('fill', '#ffffff')
      .attr('pointer-events', 'none')
      .attr('font-size', '12px')
      .attr('text-anchor', 'middle')
      .text((d: any) => {
        if (d.name && d.name.length > 4) {
          return d.name.slice(0, 4) + '...';
        }
        return d.name ? d.name : '';
      });

    node.append('title').text((d: any) => d.name);

    // init node event
    this.initNodeEvent(node);

    return node;
  }

  public initNodeEvent(node: any) {
    node.on('mouseenter', (d: any, i: number, n: any[]) => {
      const node: any = d3.select(n[i]);

      if (node._groups[0][0].classList.contains('selected')) {
        return;
      }

      node
        .select('circle')
        .attr('stroke', ColorTheme.Cyan)
        .attr('stroke-width', '12')
        .attr('stroke-opacity', '0.5');
    });

    node.on('mouseleave', (d: any, i: number, n: any[]) => {
      const node: any = d3.select(n[i]);

      if (node._groups[0][0].classList.contains('selected')) {
        return;
      }

      node.select('circle').attr('stroke-width', 0);
    });

    node.on('click', (d: any, i: number, n: any[]) => {
      const node: any = d3.select(n[i]);
      const circle = node.select('circle');

      const selected = d3.selectAll('.node.selected');

      this.removeButtonGroup(selected);

      if (node._groups[0][0].classList.contains('selected')) {
        circle.attr('stroke-width', 0);
        node.attr('class', 'node');
        this.removeButtonGroup(node);
        this.setState({ showDrawerTools: false });
      } else {
        circle.attr('stroke-width', 12).attr('stroke', ColorTheme.Cyan);
        node.attr('class', 'node selected');
        this.addButtonGroup(node);
        this.setState({ showDrawerTools: true });
      }

      this.setState({ selectedNode: d });
    });

    node.on('dblclick', () => {
      this.setState({ showNodeModal: true });
    });
  }

  public addArrowMarker(svg: any) {
    const arrow = svg
      .append('marker')
      .attr('id', 'ArrowMarker')
      .attr('markerUnits', 'strokeWidth')
      .attr('markerWidth', '14')
      .attr('markerHeight', '14')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', '30')
      .attr('refY', '0')
      .attr('orient', 'auto');
    const arrowPath = 'M0,-4 L10,0 L0,4';

    arrow
      .append('path')
      .attr('d', arrowPath)
      .attr('fill', '#A5ABB6');
  }

  public addButtonGroup(node: any) {
    const data = [1, 1, 1, 1];
    const buttonGroup = node.append('g').attr('id', 'buttonGroup');

    const pieData = d3.pie()(data);
    const arcButton = d3
      .arc()
      .innerRadius(32)
      .outerRadius(64);
    const arcText = d3
      .arc()
      .innerRadius(32)
      .outerRadius(60);

    buttonGroup
      .selectAll('.button')
      .data(pieData)
      .enter()
      .append('path')
      .attr('class', (d: any, i: number) => `button action-${i}`)
      .attr('d', (d: any) => arcButton(d))
      .attr('fill', '#c7c5ba')
      .style('cursor', 'pointer')
      .attr('stroke', '#f1f4f9')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.7);

    buttonGroup
      .selectAll('.text')
      .data(pieData)
      .enter()
      .append('text')
      .attr('class', 'text')
      .attr('transform', (d: any) => `translate(${arcText.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff')
      .attr('pointer-events', 'none')
      .attr('font-size', 11)
      .text((d: any, i: number) => {
        const actions = ['Edit', 'Add', 'Link', 'Delete'];
        return actions[i];
      });

    this.initButtonActions();

    return buttonGroup;
  }

  public initButtonActions() {
    const buttonGroup = d3.select('#buttonGroup');

    buttonGroup
      .selectAll('.button')
      .on('mouseenter', function() {
        const button: any = d3.select(this);
        button.attr('fill', '#CACACA');
      })
      .on('mouseleave', function() {
        const button: any = d3.select(this);
        button.attr('fill', '#c7c5ba');
      });

    buttonGroup.select('.button.action-0').on('click', (d) => {
      this.setState({
        selectedNode: d,
        showNodeModal: true,
      });
    });

    buttonGroup.select('.button.action-1').on('click', (d) => {
      // console.log('Expand', d);
    });

    buttonGroup.select('.button.action-2').on('click', (d) => this.showAddNode());

    buttonGroup.select('.button.action-3').on('click', (d) => this.showAddLink());

    buttonGroup.select('.button.action-4').on('click', (d: any) => {
      confirm({
        centered: true,
        title: `Do you want to delete ${d.name}?`,
        onOk: async () => await this.removeNode(d),
      });
    });
  }

  public removeButtonGroup(node: any) {
    node.select('#buttonGroup').remove();
  }

  public updateSimulation() {
    const { links, nodes } = this.state;
    const nodesEl = d3.select('.nodes');
    const linksEl = d3.select('.links');

    // Update node
    let node = nodesEl.selectAll('.node').data(nodes, (d: any) => d);
    node.exit().remove();
    const nodeEnter = this.createNode(node);
    node = nodeEnter.merge(node);

    // Update link
    let link = linksEl.selectAll('.link').data(links, (d: any) => d);
    link.exit().remove();
    const linkEnter = this.createLink(link);
    link = linkEnter.merge(link);

    this.simulation.nodes(nodes).on('tick', () => this.handleTick(link, node));
    this.simulation.force('link').links(links);
    this.simulation.alpha(1).restart();
  }

  // Add new link
  public showAddLink() {
    this.setState({ showAddLinkModal: true });
  }

  public handleAddLinkOk() {
    const { newLink } = this.state;
    // console.log(newLink);
  }

  // Add link
  public async addLink(source: number | string, target: number | string, relative: string) {
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
    } catch (err) {
      message.error(err.message);
    }
  }

  public handleAddLinkChange(value: any) {
    this.setState({
      newLink: {
        ...this.state.newLink,
        relative: value,
      },
    });
  }

  public handleAddLinkCancel(visible: boolean) {
    this.setState({
      showAddLinkModal: visible,
      newLink: {
        id: 0,
        source: null,
        target: null,
        relative: '',
      },
    });
  }

  public showAddNode() {
    this.setState({ showAddNodeModal: true });
  }

  // Add node
  public async handleAddNodeOk(node: Node) {
    const { nodes } = this.state;

    try {
      this.setState({ addNodeLoading: true });
      const { data } = await ApiService.postNode(node);

      this.setState(
        {
          nodes: nodes.concat([data]),
          addNodeLoading: false,
        },
        () => this.updateSimulation()
      );
      this.handleAddNodeCancel(false);
      message.success('Add Node Success');
    } catch (err) {
      this.setState({ addNodeLoading: false });
      message.error(err.message);
    }
  }

  public handleAddNodeCancel(visible: boolean) {
    this.setState({ showAddNodeModal: visible });
  }

  // Update nodes list
  public async handleNodeOk(node: Node) {
    const { selectedNode } = this.state;

    try {
      this.setState({ editNodeLoading: true });
      await ApiService.patchNode(selectedNode.id, node);

      const nodes = this.state.nodes.map((item) => {
        if (item.id === selectedNode.id) {
          return {
            ...selectedNode,
            ...node,
          };
        }
        return item;
      });

      this.setState(
        {
          nodes,
          selectedNode: {
            ...selectedNode,
            ...node,
          },
          editNodeLoading: false,
        },
        () => this.updateSimulation()
      );
      this.handleNodeCancel(false);

      message.success('Update Node Success');
    } catch (err) {
      this.setState({ editNodeLoading: false });
      message.error(err.message);
    }
  }

  public handleNodeCancel(visible: boolean) {
    this.setState({ showNodeModal: visible });
  }

  // Update links list
  public async handleLinkOk() {
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
        if (item.id === selectedLink.id) {
          return selectedLink;
        }
        return item;
      });

      this.setState({ links }, () => this.updateSimulation());
      this.handleLinkCancel(false);
      message.success('Update Link Success');
    } catch (err) {
      message.error(err.message);
    }
  }

  public handleLinkChange(value: any) {
    const { selectedLink } = this.state;
    this.setState({
      selectedLink: {
        ...selectedLink,
        relative: value,
      },
    });
  }

  public handleLinkCancel(visible: boolean) {
    this.setState({ showLinkModal: visible });
  }

  public async removeNode(node: any) {
    const { nodes, links } = this.state;

    try {
      const removedNodes = nodes.filter((d) => d.id === node.id);
      const removedLinks = links.filter((d) => d.source.id === node.id || d.target.id === node.id);

      await Promise.all(removedNodes.map(async (d: any) => await ApiService.deleteNode(d.id)));
      await Promise.all(removedLinks.map(async (d: any) => await ApiService.deleteLink(d.id)));

      this.setState(
        {
          nodes: nodes.filter((d) => d.id !== node.id),
          links: links.filter((d) => d.source.id !== node.id && d.target.id !== node.id),
        },
        () => this.updateSimulation()
      );
      message.success('Remove Node Success');
    } catch (err) {
      message.error(err.message);
    }
  }

  public render() {
    const {
      scale,
      selectedNode,
      selectedLink,
      showAddNodeModal,
      showNodeModal,
      showLinkModal,
      showAddLinkModal,
      addNodeLoading,
      editNodeLoading,
      showDrawerTools,
    } = this.state;

    if (this.state.loading) {
      return <Loading />;
    }

    return (
      <Content className="visual-editor">
        <TopTools scale={scale} showAddNode={() => this.showAddNode()} />
        <div
          id="Neo4jContainer"
          className="visual-editor-container"
          onClick={(e: SyntheticEvent) => this.restartSimulation(e)}
        />
        <NodeModal
          title="Add Node"
          loading={addNodeLoading}
          visible={showAddNodeModal}
          onOk={(node: Node) => this.handleAddNodeOk(node)}
          onCancel={(visible: boolean) => this.handleAddNodeCancel(visible)}
        />
        <NodeModal
          title="Edit Node"
          visible={showNodeModal}
          data={selectedNode}
          loading={editNodeLoading}
          onOk={(node: Node) => this.handleNodeOk(node)}
          onCancel={(visible: boolean) => this.handleNodeCancel(visible)}
        />
        <LinkModal
          title="Add Link"
          visible={showAddLinkModal}
          onOk={() => this.handleAddLinkOk()}
          onCancel={(visible: boolean) => this.handleAddLinkCancel(visible)}
        />
        <LinkModal
          title="Edit Link"
          visible={showLinkModal}
          data={selectedLink}
          onOk={() => this.handleLinkOk()}
          onCancel={(visible: boolean) => this.handleLinkCancel(visible)}
        />
        <DrawerTools
          node={selectedNode}
          visible={showDrawerTools}
          onClose={() => this.setState({ showDrawerTools: false })}
        />
      </Content>
    );
  }
}

// tslint:disable-next-line: max-file-line-count
export default VisualEditor;
