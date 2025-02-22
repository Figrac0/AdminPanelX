import "../../helpers/iframeLoader.js";
import axios from "axios";
import React, { Component } from "react";
import DOMHelper from "../../helpers/domHelper.js";
import EditorText from "../editor-text/editor-text.js";

export default class Editor extends Component {
    constructor() {
        super();
        this.currentPage = "index.html";
        this.state = {
            pageList: [],
            newPageName: "",
        };
        this.createNewPage = this.createNewPage.bind(this);
    }

    componentDidMount() {
        this.init(this.currentPage);
    }

    init(page) {
        this.iframe = document.querySelector("iframe");
        this.open(page);
        this.loadPageList();
    }

    open(page) {
        this.currentPage = page;

        axios
            .get(`../${page}?rnd=${Math.random()}`)
            .then((res) => DOMHelper.parseStrToDOM(res.data))
            .then(DOMHelper.wrapTextNodes)
            .then((dom) => {
                this.virtualDom = dom;
                return dom;
            })
            .then(DOMHelper.serializeDOMToString)
            .then((html) => axios.post("./api/saveTempPage.php", { html }))
            .then(() => this.iframe.load("../temp.html"))
            .then(() => this.enableEditing())
            .then(() => this.injectStyles());
    }

    save() {
        const newDom = this.virtualDom.cloneNode(this.virtualDom);
        DOMHelper.unwrapTextNodes(newDom);
        const html = DOMHelper.serializeDOMToString(newDom);
        axios.post("./api/savePage.php", { pageName: this.currentPage, html });
    }

    enableEditing() {
        this.iframe.contentDocument.body
            .querySelectorAll("text-editor")
            .forEach((element) => {
                const id = element.getAttribute("nodeid");
                const virtualElement = this.virtualDom.body.querySelector(
                    `[nodeid="${id}"]`
                );

                new EditorText(element, virtualElement);
            });
    }

    injectStyles() {
        const style = this.iframe.contentDocument.createElement("style");
        style.innerHTML = `
        text-editor:hover {
            //outline: 3px solid orange;
            outline-offset: 4px;
            background-color: rgba(161, 0, 81, 0.1);
            animation: pulse 1.5s infinite;
        }
        text-editor:focus {
            outline: 2px solid rgba(255, 165, 0, 0.5);;
            outline-offset: 4px;
            background-color: rgba(255, 0, 0, 0.1);
            animation: pulse 1.5s infinite;
        }
        text-editor:hover::selection,
        text-editor:focus::selection {
            background-color: rgba(255, 165, 0, 0.5);
            color: white;
        }

        @keyframes pulse {
        0% {
            transform: scale(1);
            box-shadow: 0 0 0 rgba(255, 165, 0, 0.7);
        }
        50% {
            transform: scale(1.05);
            box-shadow: 0 0 15px rgba(255, 0, 0, 0.1);
        }
        100% {
            transform: scale(1);
            box-shadow: 0 0 0 rgba(255, 165, 0, 0.7);
        }
    }
`;
        this.iframe.contentDocument.head.appendChild(style);
    }

    loadPageList() {
        axios.get("./api").then((res) => this.setState({ pageList: res.data }));
    }

    createNewPage() {
        axios
            .post("./api/createNewPage.php", { name: this.state.newPageName })
            .then(this.loadPageList())
            .catch(() => alert("Страница уже существует!"));
    }

    deletePage(page) {
        axios
            .post("./api/deletePage.php", { name: page })
            .then(this.loadPageList())
            .catch(() => alert("Страницы не существует!"));
    }

    render() {
        // const {pageList} = this.state;
        // const pages = pageList.map((page, i) => {
        //     return (
        //         <h1 key={i}>{page}
        //             <a
        //             href="#"
        //             onClick={() => this.deletePage(page)}>(x)</a>
        //         </h1>
        //     )
        // });

        return (
            <>
                <button onClick={() => this.save()}>Click</button>
                <iframe src={this.currentPage} frameBorder="0"></iframe>
            </>

            // <>
            //     <input
            //         onChange={(e) => {this.setState({newPageName: e.target.value})}}
            //         type="text"/>
            //     <button onClick={this.createNewPage}>Создать страницу</button>
            //     {pages}
            // </>
        );
    }
}
