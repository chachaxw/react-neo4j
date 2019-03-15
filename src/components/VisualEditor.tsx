import React, { Component } from 'react';
import { Modal, Form, Input } from 'antd';
import * as d3 from 'd3';
import './VisualEditor.css';

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
            nodes: [
                { id: 0, name: '创投大厦' },
                { id: 1, name: '三诺' },
                { id: 2, name: '36楼' },
                { id: 3, name: 'SEVEN-ELEVEN' },
                { id: 4, name: '创茶空间' },
                { id: 5, name: '驿站1号桩' },
                { id: 6, name: '驿站2号桩' },
                { id: 7, name: '驿站3号桩' },
                { id: 8, name: '驿站4号桩' },
                { id: 9, name: '驿站5号桩' },
                { id: 10, name: '驿站6号桩' },
                { id: 11, name: '驿站7号桩' },
                { id: 12, name: '驿站8号桩' },
                { id: 13, name: '驿站9号桩' },
                { id: 14, name: '驿站10号桩' },
                { id: 15, name: '驿站11号桩' },
                { id: 16, name: '驿站12号桩' },
                { id: 17, name: '驿站13号桩' },
                { id: 18, name: '驿站14号桩' },
            ],
            links: [
                { value: 1, source: 0, target: 1, relative: 'LINK_TO' },
                { value: 1, source: 1, target: 0, relative: 'LINK_TO' },
                { value: 2, source: 0, target: 2, relative: 'REFERENCE' },
                { value: 3, source: 0, target: 3, relative: 'REFERENCE' },
                { value: 4, source: 1, target: 4, relative: 'REFERENCE' },
                { value: 2, source: 0, target: 5, relative: 'REFERENCE' },
                { value: 2, source: 0, target: 6, relative: 'REFERENCE' },
                { value: 2, source: 0, target: 7, relative: 'REFERENCE' },
                { value: 2, source: 0, target: 8, relative: 'REFERENCE' },
                { value: 2, source: 0, target: 9, relative: 'REFERENCE' },
                { value: 2, source: 0, target: 10, relative: 'REFERENCE' },
                { value: 2, source: 0, target: 11, relative: 'REFERENCE' },
                { value: 2, source: 0, target: 12, relative: 'REFERENCE' },
                { value: 1, source: 1, target: 13, relative: 'REFERENCE' },
                { value: 1, source: 1, target: 14, relative: 'REFERENCE' },
                { value: 1, source: 1, target: 15, relative: 'REFERENCE' },
                { value: 1, source: 1, target: 16, relative: 'REFERENCE' },
                { value: 1, source: 1, target: 17, relative: 'REFERENCE' },
                { value: 1, source: 1, target: 18, relative: 'REFERENCE' },
            ],
        }
    }

    componentDidMount() {
        const { nodes, links } = this.state;
        const el = document.getElementById('Neo4jContainer');

        if (!el) {
            return;
        }
    
        this.initSimulation(el, nodes, links);
    }

    initSimulation(el: any, nodes: any, links: any) {
        const width = el.clientWidth;
        const height = el.clientHeight;

        this.simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).distance(180))
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

        this.simulation.on("tick", () => {
            link.selectAll('.outline')
                .attr('d', (d: any) => {
                    return 'M' + d.source.x + ', ' + d.source.y + 'A0,0 0 0,1 ' + d.target.x + ' '+ d.target.y;
                });

            link.selectAll('.overlay')
                .attr('d', (d: any) => {
                    return 'M' + d.source.x + ', ' + d.source.y + 'A0,0 0 0,1 ' + d.target.x + ' '+ d.target.y;
                });
        
            node.attr('transform', (d: any) => `translate(${d.x}, ${d.y})`);
        });

        this.initNodeEvent();
        this.initLinkEvent();

        this.simulation.alpha(1).restart();
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

    initLinks(links: any, svg: any) {
        const link = svg.append('g')
            .attr('class', 'layer links')
            .selectAll('path.outline')
            .data(links)
            .enter()
            .append('g')
            .attr('class', 'link');

        link.append('path')
            .attr('id', (d: any, i: number) => `linkPath${i}`)
            .attr('class', 'outline')
            .attr('stroke', '#A5ABB6')
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
            .attr('stroke', '#68bdf6')
            .attr('stroke-opacity', '0.5')
            .attr('stroke-width', '12')
            .style('display', 'none');

        return link;
    }

    initLinkEvent() {
        const self = this;
        return d3.selectAll('.link .outline')
            .on('mouseenter', function(d: any) {
                const node: any = d3.select(this);
                node.select('.overlay')
                    .style('display', 'block');
            })
            .on('mouseleave', function(d: any) {
                const node: any = d3.select(this);
                node.select('.overlay')
                    .style('display', 'none');
            })
            .on('click', function(d: any) {
                self.setState({ selectedLink: d });
            })
            .on('dblclick', function(d: any) {
                self.setState({ showLinkModal: true });
            });
    }

    initNodes(nodes: any, svg: any) {
        const node = svg.append("g")
            .attr('class', 'layer nodes')
            .selectAll('.node')
            .data(nodes)
            .enter()
            .append('g')
            .attr('class', 'node');

        node.append('circle')
            .attr("r", 30)
            .attr('fill', '#FB95AF')
            .attr('stroke', '#E0849B')
            .attr('stroke-width', '2')
            .call(d3.drag()
                .on("start", (d: any) => this.onDragStarted(d))
                .on("drag", (d: any) => this.onDragged(d))
                .on("end", (d: any) => this.onDragEnded(d))
            );

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

        return node;
    }

    initNodeEvent() {
        const self = this;
        return d3.selectAll('.node')
            .on('mouseenter', function(d) {
                const node: any = d3.select(this);

                if (node._groups[0][0].classList.contains('selected')) {
                    return;
                }

                node.select('circle')
                    .attr('stroke', '#FB95AF')
                    .attr('stroke-width', '12')
                    .attr('stroke-opacity', '0.5');
            })
            .on('mouseleave', function(d) {
                const node: any = d3.select(this);

                if (node._groups[0][0].classList.contains('selected')) {
                    return;
                }

                node.select('circle')
                    .attr('stroke', '#E0849B')
                    .attr('stroke-width', '2')
                    .attr('stroke-opacity', '1');
            })
            .on('click', function(d) {
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
            })
            .on('dblclick', function(d) {
                self.setState({ showNodeModal: true });
            });
    }

    initLinkText(links: any) {
        return d3.selectAll('.link')
            .data(links)
            .append('text')
            .attr("class", 'link-text')  
		    .attr('fill', '#A5ABB6')          
            .attr('font-size', '11px')
            .attr('text-anchor', 'middle')   
		    .text((d: any) => {
                if(d.relative !== ''){
                    return d.relative;
                }
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

    addNewNode() {
        this.setState({ showNodeModal: true });
    }

    handleNodeOk() {
        console.log('Ok');
    }

    handleNodeCancel() {
        this.setState({ showNodeModal: false });
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

    handleLinkCancel() {
        this.setState({ showNodeModal: false });
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
                <Modal
                    centered
                    title="配送点信息"
                    visible={showNodeModal}
                    onOk={() => this.handleNodeOk()}
                    onCancel={() => this.handleNodeCancel()}
                >
                    <p>{selectedNode.name}</p>
                </Modal>
                <Modal
                    centered
                    title="编辑配送点关系"
                    visible={showLinkModal}
                    onOk={() => this.handleLinkOk()}
                    onCancel={() => this.handleLinkCancel()}
                >
                    <Form>
                        <Form.Item label="配送点">
                            <Input required value={selectedLink.relative} onChange={(e: any) => this.handleLinkChange(e)} />
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        );
    }
}

export default VisualEditor;
