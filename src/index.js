"use strict"
import * as babylon from "babylon";
import traverse from "babel-traverse";
import * as t from "babel-types";
import generate from "babel-generator";
import template from "babel-template";

// this is a test of the emergen
export default function({ types: t }) {
	return {
		visitor: {
			BinaryExpression(path) {
				if (path.node.operator !== "===") {
					return;
				}

				path.node.left = t.identifier("sebmck");
				path.node.right = t.identifier("dork");
			}
		}
	};
}
