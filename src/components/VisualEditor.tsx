import React, { Component } from 'react';
import { Modal } from 'antd';
import * as d3 from 'd3';
import './VisualEditor.css';

interface InternalState {
    showAddModal: boolean;
    showNodeModal: boolean;
    selectedNode: any;
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
            selectedNode: {},
            nodes: [
                { id: 0, name: '创投大厦' },
                { id: 1, name: '三诺' },
                { id: 2, name: '36楼' },
                { id: 3, name: 'SEVEN-ELEVEN' },
                { id: 4, name: '创茶空间' },
                { id: 5, name: '驿站2号桩' },
            ],
            links: [
                { value: 1, source: 0, target: 1, relative: 'LINK_TO' },
                { value: 1, source: 1, target: 0, relative: 'LINK_TO' },
                { value: 2, source: 0, target: 2, relative: 'REFERENCE' },
                { value: 3, source: 0, target: 3, relative: 'REFERENCE' },
                { value: 4, source: 1, target: 4, relative: 'REFERENCE' },
                { value: 2, source: 0, target: 5, relative: 'REFERENCE' },
            ],
        }
    }

    componentDidMount() {
        const { nodes, links } = this.state;
        this.initSimulation(nodes, links);
    }

    initSimulation(nodes: any, links: any) {
        const el = document.getElementById('Neo4jContainer');

        if (!el) {
            return;
        }
    
        const width = el.clientWidth;
        const height = el.clientHeight;

        this.simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).distance(180))
            .force("charge", d3.forceManyBody().strength(-800))
            .force("collide", d3.forceCollide().strength(-60))
            .force("center", d3.forceCenter(width / 2, height / 2));

        const svg = d3.select('#Neo4jContainer').append("svg")
                    .attr("width", '100%')
                    .attr("height", '100%');

        this.onZoom(svg);

        this.addArrowMarker(svg);

        const link = this.initLinks(links, svg);
        const node = this.initNodes(nodes, svg);
        const nodeText = this.initNodeText(nodes);
        const linkText = this.initLinkText(links);

        node.append("title").text((d: any) => d.name);

        this.simulation.on("tick", () => {
            link
                .attr("x1", (d: any) => d.source.x)
                .attr("y1", (d: any) => d.source.y)
                .attr("x2", (d: any) => d.target.x)
                .attr("y2", (d: any) => d.target.y);

            linkText
                .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
                .attr('y', (d: any) => (d.source.y + d.target.y) / 2);
        
            node
                .attr("cx", (d: any) => d.x)
                .attr("cy", (d: any) => d.y);

            nodeText
                .attr("x", (d: any) => d.x)
                .attr("y", (d: any) => d.y);
        });

        this.initNodeEvent();

        return svg.node();
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
        d.fx = null;
        d.fy = null;
    }

    onZoom(svg: any) {
        // 鼠标滚轮缩放
        svg.call(d3.zoom().on('zoom', () => {
            d3.selectAll('#Neo4jContainer > svg > g').attr('transform', d3.event.transform);
        }));
        svg.on('dblclick.zoom', null); // 静止双击缩放
    }

    initLinks(links: any, svg: any) {
        return svg.append('g')
            .attr('class', 'layer links')
            .selectAll("line")
            .data(links)
            .join('g')
            .attr('class', 'link')
            .append("line")
            .attr("stroke", "#A5ABB6")
            .attr("stroke-width", 1)
            .attr('marker-end', 'url(#ArrowMarker)');
    }

    initNodes(nodes: any, svg: any) {
        return svg.append("g")
            .attr('class', 'layer nodes')
            .selectAll("circle")
            .data(nodes)
            .join('g')
            .attr('class', 'node')
            .append('circle')
            .attr("r", 30)
            .attr('fill', '#FB95AF')
            .attr('stroke', '#E0849B')
            .attr('stroke-width', '2')
            .call(d3.drag()
                .on("start", (d: any) => this.onDragStarted(d))
                .on("drag", (d: any) => this.onDragged(d))
                .on("end", (d: any) => this.onDragEnded(d))
            );
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
                    .attr('stroke-width', '8')
                    .attr('stroke-opacity', '0.5');
            })
            .on('mouseleave', function(d) {
                const node: any = d3.select(this);

                if (node._groups[0][0].classList.contains('selected')) {
                    return;
                }

                node.select('circle')
                    .attr('stroke-width', '2')
                    .attr('stroke-opacity', '1');
            })
            .on('click', function(d) {
                const node: any = d3.select(this);
                const circle = d3.select(this).select('circle');

                if (node._groups[0][0].classList.contains('selected')) {
                    circle.attr('stroke-width', '2');
                    node.attr('class', 'node');
                } else {
                    circle.attr('stroke-width', '8');
                    node.attr('class', 'node selected');
                }

                self.setState({ selectedNode: d });
            })
            .on('dblclick', function(d) {
                self.setState({ showNodeModal: true });
            });
    }

    initNodeText(nodes: any) {
        return d3.selectAll('.node')
            .data(nodes)
            .append('text')
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

    handleOk() {
        console.log('Ok');
    }

    handleCancel() {
        this.setState({ showNodeModal: false });
    }
    
    render() {
        const { showNodeModal, selectedNode } = this.state;

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
                    onOk={() => this.handleOk()}
                    onCancel={() => this.handleCancel()}
                >
                    <p>{selectedNode.name}</p>
                </Modal>
            </div>
        );
    }
}

export default VisualEditor;
