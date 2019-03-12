import React, { Component } from 'react';
import { Button, Modal } from 'antd';
import * as d3 from 'd3';
import './VisualEditor.css';

interface InternalState {
    showAddModal: boolean;
    nodes: any[];
    links: any[];
}

class VisualEditor extends Component<any, InternalState> {
    simulation: any = null;

    constructor(props: any) {
        super(props);
        this.state = {
            showAddModal: false,
            nodes: [
                { id: 0, name: '创投大厦' },
                { id: 1, name: '三诺' },
                { id: 2, name: '36楼' },
                { id: 3, name: 'SEVEN-ELEVEN' },
                { id: 4, name: '创茶空间' },
            ],
            links: [
                { value: 1, source: 0, target: 1 },
                { value: 2, source: 0, target: 2 },
                { value: 3, source: 0, target: 3 },
                { value: 4, source: 1, target: 4 },
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
        svg.on('dblclick.zoom', null); // 静止双击缩放

        this.addArrowMarker(svg);

        const link = this.addLinks(links, svg);
        const node = this.addNodes(nodes, svg);
        node.append("title").text((d: any) => d.name);
        const text = this.addTexts(nodes, svg);


        this.simulation.on("tick", () => {
            link
                .attr("x1", (d: any) => d.source.x)
                .attr("y1", (d: any) => d.source.y)
                .attr("x2", (d: any) => d.target.x)
                .attr("y2", (d: any) => d.target.y);
        
            node
                .attr("cx", (d: any) => d.x)
                .attr("cy", (d: any) => d.y);
        });

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
        return svg.call(d3.zoom().on('zoom', () => {
            svg.selectAll("g").attr('transform', d3.event.transform);
        }));
    }

    addLinks(links: any, svg: any) {
        return svg.append("g")
            .attr("stroke", "#A5ABB6")
            .attr("stroke-opacity", 0.8)
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("stroke-width", 1)
            .attr('marker-end', 'url(#ArrowMarker)');
    }

    addNodes(nodes: any, svg: any) {
        return svg.append("g")
            .attr("stroke", "#E0849B")
            .attr("stroke-width", 2)
            .selectAll("circle")
            .data(nodes)
            .join("circle")
            .attr("r", 25)
            .attr("fill", '#FB95AF')
            .call(d3.drag()
                .on("start", (d: any) => this.onDragStarted(d))
                .on("drag", (d: any) => this.onDragged(d))
                .on("end", (d: any) => this.onDragEnded(d))
            );
    }

    addTexts(nodes: any, svg: any) {
        return svg.append('g')
            .attr('class', 'text-group')
            .selectAll('text')
            .data(nodes)
            .join('text')
            .style('fill', '#fff')
            .attr('dx', 40)
            .attr('dy', 40)
            .attr('font-family', '微软雅黑')
            .attr('text-anchor', 'middle')
            .text((d: any) => {
                const l = d.name.length;
                if(l > 4){
					const name = d.name.slice(0, 4) + '...';
					return name;
                }
                return d.name;
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
        this.setState({ showAddModal: true });
    }

    handleOk() {
        console.log('Ok');
    }

    handleCancel() {
        this.setState({ showAddModal: false });
    }
    
    render() {
        const { showAddModal } = this.state;

        return (
            <div className="visual-editor">
                {/* <div className="visual-editor-tools">
                    <Button onClick={() => this.addNewNode()} size="large"
                        shape="circle" icon="plus-circle"></Button>
                </div> */}
                <div className="visual-editor-container" id="Neo4jContainer"></div>
                <Modal
                    title="新增节点"
                    visible={showAddModal}
                    onOk={() => this.handleOk()}
                    onCancel={() => this.handleCancel()}
                />
            </div>
        );
    }
}

export default VisualEditor;
