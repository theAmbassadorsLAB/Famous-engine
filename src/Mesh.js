'use strict';

/**
 * The Mesh class is responsible for providing the API for how
 * a RenderNode will interact with the WebGL API by adding
 * a set of commands to the renderer.
 *
 * @class Mesh
 * @constructor
 * @param {RenderNode} RenderNode to which the instance of Mesh will be a component of
 */

function Mesh (dispatch) {
    this.dispatch = dispatch;
    this.queue = ['GL_CREATE_MESH'];
    this._size = [0, 0, 0];
    this._id = dispatch.addRenderable(this);

    this.uniforms = [];
    this.buffers = [];

    this._size = [];

    this.init();
    this._geometry = void 0;
}

// Return the name of the Mesh Class: 'Mesh'
Mesh.toString = function toString () {
    return 'Mesh';
};

Mesh.prototype.init = function init() {
    var dispatch = this.dispatch;
    dispatch.onTransformChange(this._receiveTransformChange.bind(this));
    dispatch.onSizeChange(this._receiveSizeChange.bind(this));
    dispatch.onOpacityChange(this._receiveOpacityChange.bind(this));
    dispatch.onOriginChange(this._receiveOriginChange.bind(this));
    this._receiveTransformChange(dispatch.getContext()._transform);
    this._receiveOriginChange(dispatch.getContext()._origin);
    return this;
};

Mesh.prototype._receiveTransformChange = function _receiveTransformChange(transform) {
    this.dispatch.dirtyRenderable(this._id);

    this.queue.push('GL_UNIFORMS');
    this.queue.push('transform');
    this.queue.push(transform._matrix);
};

Mesh.prototype._receiveSizeChange = function _receiveSizeChange(size) {
    var size = size.getTopDownSize();
    this.dispatch.dirtyRenderable(this._id);

    this._size[0] = size[0];
    this._size[1] = size[1];
    this._size[2] = size[2];

    this.queue.push('GL_UNIFORMS');
    this.queue.push('size');
    this.queue.push(size);
};

Mesh.prototype._receiveOriginChange = function _receiveOriginChange(origin) {
    this.dispatch.dirtyRenderable(this._id);

    this.queue.push('GL_UNIFORMS');
    this.queue.push('origin');
    this.queue.push(origin);
};

Mesh.prototype._receiveOpacityChange = function _receiveOpacityChange(opacity) {
    this.dispatch.dirtyRenderable(this._id);

    this.queue.push('GL_UNIFORMS');
    this.queue.push('opacity');
    this.queue.push(opacity);
};

Mesh.prototype.getSize = function getSize() {
    return this._size;
};

/**
 * Set the geometry of a mesh
 *
 * @method setGeometry
 * @chainable
 *
 * @param {Geometry} geometry instance to be associated with the mesh
 */
Mesh.prototype.setGeometry = function (geometry) {
    var i;
    var key;
    var buffers;
    var bufferIndex;

    if (this._geometry !== geometry) {
        this.queue.push('GL_SET_GEOMETRY');
        this.queue.push(geometry.id);
        this.queue.push(geometry.spec.type);
        this.queue.push(geometry.spec.dynamic);

        this._geometry = geometry;
    }

    return this;
};

/**
 * Empties the command queue
 *
 * @method clean
 * @chainable
 *
 */

Mesh.prototype.clean = function clean() {
    var path = this.dispatch.getRenderPath();

    this.dispatch
        .sendDrawCommand('WITH')
        .sendDrawCommand(path);

    var bufferIndex;
    i = this._geometry.spec.invalidations.length;
    while (i--) {
        bufferIndex = this._geometry.spec.invalidations.pop();
        this.dispatch.sendDrawCommand('GL_BUFFER_DATA');
        this.dispatch.sendDrawCommand(this._geometry.id);
        this.dispatch.sendDrawCommand(this._geometry.spec.bufferNames[i]);
        this.dispatch.sendDrawCommand(this._geometry.spec.bufferValues[i]);
        this.dispatch.sendDrawCommand(this._geometry.spec.bufferSpacings[i]);
    }

    var i = this.queue.length;
    while (i--) this.dispatch.sendDrawCommand(this.queue.shift());

    return !this.queue.length;
};

/**
 * Defines a 3-element map that provides the overall color of the mesh.
 *
 * @method baseColor
 * @chainable
 *
 * @param {Object, Array} Material, image, or vec3
 * @return {Element} current Mesh
 */

Mesh.prototype.baseColor = function (materialExpression) {
    this.dispatch.dirtyRenderable(this._id);

    if (materialExpression._compile) materialExpression = materialExpression._compile();
    if (Array.isArray(materialExpression)) {
        this.queue.push('GL_UNIFORMS');
    }
    else {
        this._baseColor = materialExpression;
        this.queue.push('MATERIAL_INPUT');
    }
    
    this.queue.push('baseColor');
    this.queue.push(materialExpression);
    return this;
};

/**
 * Defines a 3-element map which is used to provide significant physical detail to
 * the surface by perturbing the facing direction of each individual pixel.
 *
 * @method normal
 * @chainable
 *
 * @param {Object, Array} Material, Image or vec3
 * @return {Element} current Mesh
 */

Mesh.prototype.normal = function (materialExpression) {
    if (materialExpression._compile) materialExpression = materialExpression._compile();
    this.queue.push(typeof materialExpression === 'number' ? 'UNIFORM_INPUT' : 'MATERIAL_INPUT');
    this.queue.push('normal');
    this.queue.push(materialExpression);
    return this;
};

/**
 * Defines 1 element map which is used to normalize the specular and diffuseness of a surface.
 *
 * @method glossiness
 * @chainable
 *
 * @param {Object} Material or Image
 * @return {Element} current Mesh
 */

Mesh.prototype.glossiness = function (materialExpression) {
    if (materialExpression._compile) materialExpression = materialExpression._compile();
    this.queue.push(typeof materialExpression === 'number' ? 'UNIFORM_INPUT' : 'MATERIAL_INPUT');
    this.queue.push('glossiness');
    this.queue.push(materialExpression);
    return this;
};

/**
 * Defines 1 element map which describes the electrical conductivity of a material.
 *
 * @method metallic
 * @chainable
 *
 * @param {Object} Material or Image
 * @return {Element} current Mesh
 */

Mesh.prototype.metallic = function metallic(materialExpression) {
    if (materialExpression._compile) materialExpression = materialExpression._compile();
    this.queue.push(typeof materialExpression === 'number' ? 'UNIFORM_INPUT' : 'MATERIAL_INPUT');
    this.queue.push('metallic');
    this.queue.push(materialExpression);
    return this;
};

module.exports = Mesh;
