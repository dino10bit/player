/// <reference path="../../js/jquery.d.ts" />
/// <reference path="../../js/extensions.d.ts" />
import baseProvider = require("../../modules/coreplayer-shared-module/baseProvider");
import utils = require("../../utils");
import IPDFProvider = require("./iPDFProvider");

export class Provider extends baseProvider.BaseProvider implements IPDFProvider{

    constructor(config: any, manifest: any) {
        super(config, manifest);

        this.config.options = $.extend(true, this.options, {
            // override or extend BaseProvider options.
            // these are in turn overridden by the root options object in this extension's config.js.
        }, config.options);
    }

    getPDFUri(): string{
        var canvas = this.getCanvasByIndex(0);
        return canvas.mediaUri;
    }

    getEmbedScript(anchor: string, width: number, height: number, embedTemplate: string): string{

        var esu = this.options.embedScriptUri || this.embedScriptUri;

        var template = this.options.embedTemplate || embedTemplate;

        var configUri = this.config.uri || '';

        // todo: to support anchors it needs to be updated as the pdf is scrolled.
        var script = String.prototype.format(template, this.dataUri, this.sequenceIndex, configUri, width, height, esu);

        return script;
    }
}
